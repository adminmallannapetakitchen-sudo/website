import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto, UpdateNotificationPrefsDto, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreference: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      phone: user.phoneE164,
      name: user.name,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      hasPassword: !!user.hashedPassword,
      hasGoogle: !!user.googleId,
      notificationPreferences: user.notificationPreference ?? {
        sundaySpecialAlerts: true,
        orderUpdates: true,
        marketing: false,
      },
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id: userId } },
      });
      if (existing) throw new BadRequestException('Email already in use');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
      },
      select: { id: true, name: true, email: true, phoneE164: true, role: true },
    });
  }

  // ─── ADDRESSES ─────────────────────────────────────────────────────

  async listAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId, deletedAt: null },
          data: { isDefault: false },
        });
      }
      const isFirst = (await tx.userAddress.count({ where: { userId, deletedAt: null } })) === 0;
      return tx.userAddress.create({
        data: {
          userId,
          label: dto.label,
          line1: dto.line1,
          line2: dto.line2,
          landmark: dto.landmark,
          city: dto.city,
          pincode: dto.pincode,
          isDefault: dto.isDefault ?? isFirst,
        },
      });
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Address not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId, deletedAt: null, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Address not found');

    await this.prisma.userAddress.update({
      where: { id: addressId },
      data: { deletedAt: new Date(), isDefault: false },
    });
    return { ok: true };
  }

  // ─── NOTIFICATION PREFERENCES ─────────────────────────────────────

  async updateNotificationPrefs(userId: string, dto: UpdateNotificationPrefsDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }
}
