import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomInt, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { TokensService } from './tokens.service';
import { GoogleVerifierService } from './google-verifier.service';
import { SMS_SERVICE, SmsService } from './sms/sms.service';
import { normalizePhoneToE164 } from '../../common/utils/phone';
import { Role } from '@prisma/client';

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly google: GoogleVerifierService,
    private readonly config: ConfigService,
    @Inject(SMS_SERVICE) private readonly sms: SmsService,
  ) {}

  // ─── EMAIL + PASSWORD ───────────────────────────────────────────────

  async registerWithEmail(
    email: string,
    password: string,
    name?: string,
    phone?: string,
    meta: { ip?: string; ua?: string } = {},
  ) {
    const normalized = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) throw new BadRequestException('Email already registered');

    // H-2: persist the phone given at registration (previously dropped).
    let phoneE164: string | undefined;
    if (phone) {
      phoneE164 = normalizePhoneToE164(phone);
      const taken = await this.prisma.user.findUnique({ where: { phoneE164 } });
      if (taken) throw new BadRequestException('Phone number already in use');
    }

    const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        hashedPassword,
        name,
        phoneE164,
        role: Role.CUSTOMER,
        notificationPreference: { create: {} },
      },
    });

    const tokens = await this.tokens.issueTokens(user, { userAgent: meta.ua, ipAddress: meta.ip });
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async loginWithEmail(email: string, password: string, meta: { ip?: string; ua?: string } = {}) {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const ok = await argon2.verify(user.hashedPassword, password);
    if (!ok) {
      // H1: atomic increment at the DB. The previous read-then-write lost
      // updates under concurrency, letting parallelised brute-force defeat
      // the lockout entirely.
      const { failedLoginCount } = await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
        select: { failedLoginCount: true },
      });
      if (failedLoginCount >= MAX_FAILED_LOGINS) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
            failedLoginCount: 0,
          },
        });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const tokens = await this.tokens.issueTokens(user, { userAgent: meta.ua, ipAddress: meta.ip });
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── GOOGLE ──────────────────────────────────────────────────────────

  async loginWithGoogle(idToken: string, meta: { ip?: string; ua?: string } = {}) {
    const profile = await this.google.verifyIdToken(idToken);
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          googleId: profile.sub,
          name: profile.name,
          emailVerifiedAt: new Date(),
          role: Role.CUSTOMER,
          notificationPreference: { create: {} },
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.sub, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
      });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokens = await this.tokens.issueTokens(user, { userAgent: meta.ua, ipAddress: meta.ip });
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── PHONE OTP ───────────────────────────────────────────────────────

  async requestPhoneOtp(phoneInput: string) {
    const phoneE164 = normalizePhoneToE164(phoneInput);
    const otpLength = this.config.get<number>('msg91.otpLength') ?? 6;
    const otpExpiry = this.config.get<number>('msg91.otpExpiryMinutes') ?? 10;

    const otp = String(randomInt(0, 10 ** otpLength)).padStart(otpLength, '0');
    const otpHash = createHash('sha256').update(otp).digest('hex');

    // Invalidate any pending OTPs for this phone+purpose
    await this.prisma.phoneOtp.updateMany({
      where: { phoneE164, purpose: 'login', usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    await this.prisma.phoneOtp.create({
      data: {
        phoneE164,
        otpHash,
        purpose: 'login',
        expiresAt: new Date(Date.now() + otpExpiry * 60 * 1000),
      },
    });

    await this.sms.sendOtp(phoneE164, otp);
    return { sent: true, phone: phoneE164, expiresInSeconds: otpExpiry * 60 };
  }

  async verifyPhoneOtp(phoneInput: string, otp: string, name?: string, meta: { ip?: string; ua?: string } = {}) {
    const phoneE164 = normalizePhoneToE164(phoneInput);
    const otpHash = createHash('sha256').update(otp).digest('hex');

    const record = await this.prisma.phoneOtp.findFirst({
      where: { phoneE164, purpose: 'login', usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('OTP expired or not found. Request a new one.');

    if (record.attempts >= record.maxAttempts) {
      await this.prisma.phoneOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }

    if (record.otpHash !== otpHash) {
      await this.prisma.phoneOtp.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.phoneOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    let user = await this.prisma.user.findUnique({ where: { phoneE164 } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneE164,
          name,
          role: Role.CUSTOMER,
          phoneVerifiedAt: new Date(),
          notificationPreference: { create: {} },
        },
      });
    } else if (!user.phoneVerifiedAt) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokens = await this.tokens.issueTokens(user, { userAgent: meta.ua, ipAddress: meta.ip });
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── ATTACH PHONE TO EXISTING ACCOUNT (H-2) ──────────────────────────

  /** Send an OTP to attach/verify a phone for an already-authenticated user. */
  async addPhoneRequestOtp(userId: string, phoneInput: string) {
    const phoneE164 = normalizePhoneToE164(phoneInput);

    const taken = await this.prisma.user.findFirst({
      where: { phoneE164, NOT: { id: userId } },
    });
    if (taken) throw new BadRequestException('Phone number already in use');

    const otpLength = this.config.get<number>('msg91.otpLength') ?? 6;
    const otpExpiry = this.config.get<number>('msg91.otpExpiryMinutes') ?? 10;
    const otp = String(randomInt(0, 10 ** otpLength)).padStart(otpLength, '0');
    const otpHash = createHash('sha256').update(otp).digest('hex');

    await this.prisma.phoneOtp.updateMany({
      where: { phoneE164, purpose: 'attach_phone', usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    await this.prisma.phoneOtp.create({
      data: {
        phoneE164,
        otpHash,
        purpose: 'attach_phone',
        expiresAt: new Date(Date.now() + otpExpiry * 60 * 1000),
      },
    });

    await this.sms.sendOtp(phoneE164, otp);
    return { sent: true, phone: phoneE164, expiresInSeconds: otpExpiry * 60 };
  }

  /** Verify the OTP and bind the phone to the authenticated user. */
  async addPhoneVerifyOtp(userId: string, phoneInput: string, otp: string) {
    const phoneE164 = normalizePhoneToE164(phoneInput);
    const otpHash = createHash('sha256').update(otp).digest('hex');

    const record = await this.prisma.phoneOtp.findFirst({
      where: { phoneE164, purpose: 'attach_phone', usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new BadRequestException('OTP expired or not found. Request a new one.');

    if (record.attempts >= record.maxAttempts) {
      await this.prisma.phoneOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }
    if (record.otpHash !== otpHash) {
      await this.prisma.phoneOtp.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.phoneOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    const taken = await this.prisma.user.findFirst({
      where: { phoneE164, NOT: { id: userId } },
    });
    if (taken) throw new BadRequestException('Phone number already in use');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phoneE164, phoneVerifiedAt: new Date() },
    });
    return { ok: true, user: this.sanitizeUser(user) };
  }

  // ─── REFRESH / LOGOUT ────────────────────────────────────────────────

  async refresh(refreshToken: string, meta: { ip?: string; ua?: string } = {}) {
    return this.tokens.rotateRefreshToken(refreshToken, { userAgent: meta.ua, ipAddress: meta.ip });
  }

  async logout(refreshToken: string) {
    await this.tokens.revokeRefreshToken(refreshToken);
    return { ok: true };
  }

  // ─── PASSWORD RESET ──────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always 200 to prevent email enumeration
    if (!user) return { ok: true };

    const raw = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(raw).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // L2: never return the reset token in the HTTP response. In non-production
    // it's logged server-side for local testing; production users get it by
    // email only.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[DEV] Password reset token for ${user.email}: ${raw}`);
    }

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const hash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { hashedPassword: hashed } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    // L3 (accepted tradeoff): refresh tokens are revoked immediately, but any
    // already-issued access token stays valid until it expires (≤ JWT_ACCESS_TTL,
    // 15m). Acceptable given the short TTL; documented rather than adding a
    // per-request token denylist.
    await this.tokens.revokeAllForUser(record.userId);

    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedPassword) throw new NotFoundException('User not found');

    const ok = await argon2.verify(user.hashedPassword, currentPassword);
    if (!ok) throw new UnauthorizedException('Current password incorrect');

    const hashed = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({ where: { id: user.id }, data: { hashedPassword: hashed } });
    await this.tokens.revokeAllForUser(user.id);
    return { ok: true };
  }

  // ─── HELPER ──────────────────────────────────────────────────────────

  private sanitizeUser(user: { id: string; email: string | null; phoneE164: string | null; name: string | null; role: Role }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phoneE164,
      name: user.name,
      role: user.role,
    };
  }
}
