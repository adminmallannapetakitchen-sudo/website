import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Either the base PrismaService or an interactive transaction client. */
type Db = PrismaService | Prisma.TransactionClient;

export interface PricedItem {
  cartItemId: string;
  menuItemId: string;
  variantId: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  name: string;
  nameTe?: string | null;
  variantLabel?: string | null;
  imageUrl?: string | null;
  itemSnapshot: Prisma.InputJsonValue;
  variantSnapshot: Prisma.InputJsonValue | null;
}

export interface PriceBreakdown {
  items: PricedItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string | null;
  couponId?: string | null;
  estimatedDeliveryMinutes: number;
  kitchenIsOpen: boolean;
  minOrderValue: number;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recompute all prices server-side from the current cart and current menu/kitchen state.
   * Never trust prices coming from the client.
   */
  async quote(
    userId: string,
    opts: { couponCode?: string } = {},
    db: Db = this.prisma,
  ): Promise<PriceBreakdown> {
    const [cart, kitchen] = await Promise.all([
      db.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              menuItem: { include: { category: true } },
              variant: true,
            },
          },
        },
      }),
      db.kitchenSettings.findUnique({ where: { id: 'settings' } }),
    ]);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    if (!kitchen) {
      throw new BadRequestException('Kitchen not configured');
    }

    const priced: PricedItem[] = [];
    for (const ci of cart.items) {
      if (!ci.menuItem || ci.menuItem.deletedAt || !ci.menuItem.isAvailable) {
        throw new BadRequestException(`Item "${ci.menuItem?.name ?? 'unknown'}" is no longer available`);
      }
      let unitPrice: number;
      let variantSnapshot: Prisma.InputJsonValue | null = null;
      let variantLabel: string | null = null;

      if (ci.variantId) {
        if (!ci.variant || ci.variant.deletedAt || !ci.variant.isAvailable) {
          throw new BadRequestException(`Variant for "${ci.menuItem.name}" is no longer available`);
        }
        unitPrice = Number(ci.variant.price);
        variantLabel = ci.variant.label;
        variantSnapshot = {
          id: ci.variant.id,
          label: ci.variant.label,
          labelTe: ci.variant.labelTe,
          price: unitPrice,
        };
      } else {
        // No variant — items must have at least one variant in our schema
        throw new BadRequestException(`Please select a variant for "${ci.menuItem.name}"`);
      }

      const lineTotal = +(unitPrice * ci.qty).toFixed(2);

      priced.push({
        cartItemId: ci.id,
        menuItemId: ci.menuItemId,
        variantId: ci.variantId,
        qty: ci.qty,
        unitPrice,
        lineTotal,
        name: ci.menuItem.name,
        nameTe: ci.menuItem.nameTe,
        variantLabel,
        imageUrl: ci.menuItem.imageUrl,
        itemSnapshot: {
          id: ci.menuItem.id,
          name: ci.menuItem.name,
          nameTe: ci.menuItem.nameTe,
          slug: ci.menuItem.slug,
          description: ci.menuItem.description,
          imageUrl: ci.menuItem.imageUrl,
          categoryName: ci.menuItem.category.name,
          isVeg: ci.menuItem.isVeg,
        },
        variantSnapshot,
      });
    }

    const subtotal = +priced.reduce((s, p) => s + p.lineTotal, 0).toFixed(2);

    // Coupon
    let discount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (opts.couponCode) {
      const cp = await this.validateCoupon(opts.couponCode, userId, subtotal, db);
      discount = cp.discount;
      couponId = cp.couponId;
      couponCode = cp.code;
    }

    const deliveryFee = Number(kitchen.deliveryFee);
    const total = Math.max(0, +(subtotal - discount + deliveryFee).toFixed(2));

    return {
      items: priced,
      subtotal,
      discount,
      deliveryFee,
      total,
      couponCode,
      couponId,
      estimatedDeliveryMinutes: kitchen.estimatedPrepMinutes,
      kitchenIsOpen: kitchen.isOpen,
      minOrderValue: Number(kitchen.minOrderValue),
    };
  }

  async validateCoupon(code: string, userId: string, subtotal: number, db: Db = this.prisma) {
    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || coupon.deletedAt || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon');
    }
    const now = new Date();
    if (coupon.validFrom > now || coupon.validTo < now) {
      throw new BadRequestException('Coupon expired or not yet valid');
    }
    if (coupon.totalUsageLimit && coupon.currentUsageCount >= coupon.totalUsageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (Number(coupon.minOrderValue) > subtotal) {
      throw new BadRequestException(`Minimum order value of ₹${coupon.minOrderValue} required`);
    }
    const userRedemptions = await db.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });
    if (userRedemptions >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon');
    }

    let discount = 0;
    if (coupon.type === 'FLAT') discount = Number(coupon.value);
    else discount = +(subtotal * (Number(coupon.value) / 100)).toFixed(2);

    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.min(discount, subtotal);

    return { couponId: coupon.id, code: coupon.code, discount };
  }
}
