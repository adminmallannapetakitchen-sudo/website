import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../checkout/pricing.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupons.dto';

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  // Customer-facing validation. Validates against the supplied cart subtotal
  // (instant, no cart-sync needed); throws BadRequest with a clear message if
  // the coupon is invalid for this user/order.
  async validate(userId: string, code: string, subtotal?: number) {
    if (subtotal != null) {
      const cp = await this.pricing.validateCoupon(code, userId, subtotal);
      return { code: cp.code, discount: cp.discount };
    }
    const quote = await this.pricing.quote(userId, { couponCode: code });
    return { code: quote.couponCode, discount: quote.discount, total: quote.total };
  }

  // Public offers list for customers — active, currently valid, advertised.
  listPublic() {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isPublic: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: { value: 'desc' },
      select: {
        code: true,
        description: true,
        type: true,
        value: true,
        minOrderValue: true,
        maxDiscount: true,
        perUserLimit: true,
        validTo: true,
      },
    });
  }

  list(opts: { active?: boolean } = {}) {
    return this.prisma.coupon.findMany({
      where: {
        deletedAt: null,
        ...(opts.active === undefined ? {} : { isActive: opts.active }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateCouponDto) {
    if (dto.validFrom >= dto.validTo) throw new BadRequestException('validFrom must be before validTo');
    if (dto.type === 'PERCENT' && dto.value > 100) throw new BadRequestException('Percent cannot exceed 100');
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount,
        totalUsageLimit: dto.totalUsageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Coupon not found');
    if (dto.validFrom && dto.validTo && dto.validFrom >= dto.validTo) {
      throw new BadRequestException('validFrom must be before validTo');
    }
    return this.prisma.coupon.update({ where: { id }, data: dto });
  }

  async softDelete(id: string) {
    await this.prisma.coupon.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { ok: true };
  }
}
