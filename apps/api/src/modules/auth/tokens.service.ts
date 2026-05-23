import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
  role: string;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseTtlToMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2];
    return n * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const)[unit as 's' | 'm' | 'h' | 'd']!;
  }

  async issueTokens(
    user: Pick<User, 'id' | 'email' | 'phoneE164' | 'role'>,
    meta: { userAgent?: string; ipAddress?: string; familyId?: string } = {},
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phoneE164,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl') as any,
    });

    const refreshTtl = this.config.get<string>('jwt.refreshTtl')!;
    const rawRefresh = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawRefresh);
    const familyId = meta.familyId ?? randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + this.parseTtlToMs(refreshTtl)),
      },
    });

    return { accessToken, refreshToken: `${familyId}.${rawRefresh}` };
  }

  async rotateRefreshToken(
    refreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [familyId, raw] = refreshToken.split('.');
    if (!familyId || !raw) throw new UnauthorizedException('Malformed refresh token');

    const hash = this.hashToken(raw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!stored || stored.familyId !== familyId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (stored.revokedAt) {
      // REUSE DETECTED — invalidate whole family
      await this.prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected; please log in again');
    }

    // M1: atomically CLAIM this token. The conditional updateMany flips
    // revokedAt from null in a single statement, so of N concurrent rotations
    // of the same token exactly one gets count === 1. Previously the
    // findUnique→update gap let two requests both mint fresh token families
    // from one refresh token.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) {
      // Lost the race — this exact token was already rotated concurrently.
      // Treat it as reuse and revoke the whole family.
      await this.prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected; please log in again');
    }

    // We own the rotation: issue the new token in the same family.
    const tokens = await this.issueTokens(stored.user, { ...meta, familyId });
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedBy: tokens.refreshToken.split('.')[1] },
    });

    return tokens;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const [, raw] = refreshToken.split('.');
    if (!raw) return;
    const hash = this.hashToken(raw);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
