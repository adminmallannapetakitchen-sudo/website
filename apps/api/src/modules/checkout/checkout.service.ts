import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from './pricing.service';
import { generateOrderNumber } from '../../common/utils/order-number';
import { PaymentsService } from '../payments/payments.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersEventBus } from '../orders/orders-event-bus.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly payments: PaymentsService,
    private readonly realtime: RealtimeGateway,
    private readonly orderEvents: OrdersEventBus,
  ) {}

  async quote(userId: string, couponCode?: string) {
    return this.pricing.quote(userId, { couponCode });
  }

  async placeOrder(
    userId: string,
    dto: {
      addressId: string;
      paymentMethod: PaymentMethod;
      couponCode?: string;
      specialInstructions?: string;
      idempotencyKey?: string;
    },
  ) {
    // 1. Pre-checks that do NOT depend on the cart (safe outside the tx).
    const [user, address, kitchen] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.userAddress.findFirst({
        where: { id: dto.addressId, userId, deletedAt: null },
      }),
      this.prisma.kitchenSettings.findUnique({ where: { id: 'settings' } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!address) throw new NotFoundException('Address not found');
    if (!kitchen) throw new BadRequestException('Kitchen not configured');
    if (!kitchen.isOpen) {
      throw new BadRequestException(kitchen.closedMessage ?? 'Kitchen is currently closed');
    }

    // H-2: a reachable phone number is mandatory — the kitchen calls the
    // customer for every delivery. Email/Google signups have none.
    if (!user.phoneE164) {
      throw new BadRequestException(
        'A verified phone number is required to place an order. Please add your phone number.',
      );
    }

    // Pincode serviceability
    const servable = await this.prisma.serviceablePincode.findFirst({
      where: { pincode: address.pincode, deletedAt: null, isActive: true },
    });
    if (!servable) {
      throw new BadRequestException(`Sorry, we don't deliver to ${address.pincode} yet`);
    }

    let isReplay = false;
    let result: { order: any; payment: any };
    try {
      // 2. Everything cart-derived happens inside ONE transaction that holds a
      //    pessimistic lock on the user's cart row. This serialises concurrent
      //    checkouts for the same user (double-click / multi-tab / retry) — the
      //    second one sees the cart already cleared (C1).
      result = await this.prisma.$transaction(
        async (tx) => {
          // C1: lock the cart row for the duration of the tx.
          await tx.$queryRaw`SELECT id FROM carts WHERE user_id = ${userId} FOR UPDATE`;

          // C1: idempotent replay — if this attempt already produced an order,
          // return it instead of charging again.
          if (dto.idempotencyKey) {
            const existing = await tx.order.findUnique({
              where: { idempotencyKey: dto.idempotencyKey },
              include: { items: true, payment: true },
            });
            if (existing) {
              if (existing.userId !== userId) {
                throw new ForbiddenException('Idempotency key belongs to another user');
              }
              isReplay = true;
              return { order: existing, payment: existing.payment };
            }
          }

          // Recompute prices from the *locked* cart inside the tx.
          const quote = await this.pricing.quote(userId, { couponCode: dto.couponCode }, tx);
          if (quote.subtotal < quote.minOrderValue) {
            throw new BadRequestException(`Minimum order value is ₹${quote.minOrderValue}`);
          }

          const order = await tx.order.create({
            data: {
              orderNumber: generateOrderNumber(),
              userId,
              idempotencyKey: dto.idempotencyKey ?? null,
              status:
                dto.paymentMethod === PaymentMethod.COD
                  ? OrderStatus.CONFIRMED
                  : OrderStatus.PENDING_PAYMENT,
              subtotal: quote.subtotal,
              discount: quote.discount,
              deliveryFee: quote.deliveryFee,
              total: quote.total,
              paymentMethod: dto.paymentMethod,
              customerNameSnapshot: user.name ?? 'Customer',
              customerPhoneSnapshot: user.phoneE164!,
              customerEmailSnapshot: user.email,
              addressSnapshot: {
                label: address.label,
                line1: address.line1,
                line2: address.line2,
                landmark: address.landmark,
                city: address.city,
                pincode: address.pincode,
              },
              specialInstructions: dto.specialInstructions,
              couponId: quote.couponId,
              couponCodeSnapshot: quote.couponCode,
              estimatedDeliveryMinutes: quote.estimatedDeliveryMinutes,
              confirmedAt: dto.paymentMethod === PaymentMethod.COD ? new Date() : null,
              items: {
                create: quote.items.map((p) => ({
                  menuItemId: p.menuItemId,
                  variantId: p.variantId,
                  itemSnapshot: p.itemSnapshot,
                  variantSnapshot: p.variantSnapshot ?? undefined,
                  qty: p.qty,
                  unitPrice: p.unitPrice,
                  lineTotal: p.lineTotal,
                })),
              },
              statusHistory: {
                create: {
                  fromStatus: null,
                  toStatus:
                    dto.paymentMethod === PaymentMethod.COD
                      ? OrderStatus.CONFIRMED
                      : OrderStatus.PENDING_PAYMENT,
                  actorUserId: userId,
                  notes: 'Order placed',
                },
              },
            },
            include: { items: true },
          });

          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              method: dto.paymentMethod,
              status: PaymentStatus.PENDING,
              amount: quote.total,
            },
          });

          // C2/C3: atomic coupon redemption.
          if (quote.couponId) {
            // C3: conditional increment — only succeeds while the coupon is
            // still under its total usage limit. Two concurrent redemptions
            // serialise on the coupon row; the loser gets 0 rows and the
            // whole tx rolls back.
            const incremented = await tx.$executeRaw`
              UPDATE "coupons"
                 SET "current_usage_count" = "current_usage_count" + 1,
                     "updated_at" = now()
               WHERE "id" = ${quote.couponId}
                 AND ("total_usage_limit" IS NULL
                      OR "current_usage_count" < "total_usage_limit")`;
            if (incremented === 0) {
              throw new BadRequestException('Coupon usage limit reached');
            }
            // C2: per-user limit is enforced by pricing.validateCoupon's
            // in-tx redemption count, which is accurate because the cart
            // lock serialises this user's concurrent checkouts.
            await tx.couponRedemption.create({
              data: {
                couponId: quote.couponId,
                userId,
                orderId: order.id,
                discountApplied: quote.discount,
              },
            });
          }

          // Clear the (locked) cart.
          await tx.cartItem.deleteMany({ where: { cart: { userId } } });

          return { order, payment };
        },
        { timeout: 20000, maxWait: 10000 },
      );
    } catch (err) {
      // Belt-and-suspenders: a racing request with the same idempotency key
      // won the unique constraint — return that order instead of erroring.
      if (
        dto.idempotencyKey &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await this.prisma.order.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { items: true, payment: true },
        });
        if (existing && existing.userId === userId) {
          result = { order: existing, payment: existing.payment };
          isReplay = true;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // 3. Razorpay order (outside the DB tx to keep the tx short).
    let razorpayOrder: { id: string; amount: number; currency: string; keyId: string } | null = null;
    if (result.order.paymentMethod === PaymentMethod.RAZORPAY) {
      if (isReplay && result.payment?.razorpayOrderId) {
        // Replay: do NOT create a second Razorpay order — reconstruct from
        // the stored one so the client can resume the same payment.
        razorpayOrder = {
          id: result.payment.razorpayOrderId,
          amount: Math.round(Number(result.order.total) * 100),
          currency: 'INR',
          keyId: this.payments.publicKeyId(),
        };
      } else if (!isReplay) {
        razorpayOrder = await this.payments.createRazorpayOrder({
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          amount: Number(result.order.total),
        });
      }
    } else if (!isReplay) {
      // COD: notify admin immediately (only on first creation).
      this.realtime.notifyAdminNewOrder(result.order.id);
      this.orderEvents.emitNewOrder(result.order.id);
    }

    return {
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        total: Number(result.order.total),
        paymentMethod: result.order.paymentMethod,
      },
      razorpay: razorpayOrder,
      idempotentReplay: isReplay,
    };
  }
}
