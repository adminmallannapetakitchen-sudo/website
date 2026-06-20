import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PAYMENT_GATEWAY, PaymentGatewayService } from './payment-gateway.interface';
import { OrdersEventBus } from '../orders/orders-event-bus.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayService,
    private readonly events: OrdersEventBus,
    private readonly realtime: RealtimeGateway,
  ) {}

  mode() {
    return this.gateway.mode();
  }

  async createPaymentSession({
    orderId,
    orderNumber,
    amount,
    customer,
  }: {
    orderId: string;
    orderNumber: string;
    amount: number;
    customer: { id: string; name: string; phone: string; email?: string | null };
  }) {
    const cf = await this.gateway.createOrder({
      orderRef: orderNumber,
      internalOrderId: orderId,
      amount,
      customer,
    });
    // Store the merchant order_ref (= orderNumber) we sent to Cashfree. Webhooks
    // and status checks match on this. (Legacy column name: razorpayOrderId.)
    await this.prisma.payment.update({
      where: { orderId },
      data: { razorpayOrderId: cf.orderRef },
    });
    return { paymentSessionId: cf.paymentSessionId, orderRef: cf.orderRef, mode: cf.mode };
  }

  /** Idempotent replay: re-fetch the existing Cashfree order to resume its session. */
  async resumePaymentSession(orderRef: string) {
    const status = await this.gateway.getOrderStatus(orderRef);
    return {
      paymentSessionId: status.paymentSessionId ?? '',
      orderRef,
      mode: this.gateway.mode(),
      orderStatus: status.orderStatus,
    };
  }

  async verifyAndCapture(userId: string, dto: { internalOrderId: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.internalOrderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    // H2: this order must belong to the caller. Without this, any logged-in
    // user could confirm someone else's order.
    if (order.userId !== userId) {
      throw new ForbiddenException('This order does not belong to you');
    }
    if (!order.payment) throw new NotFoundException('Payment record missing');
    if (!order.payment.razorpayOrderId) {
      throw new BadRequestException('No payment session exists for this order');
    }

    // Fast idempotent path.
    if (order.payment.status === PaymentStatus.CAPTURED) {
      return { ok: true, alreadyCaptured: true, order: { id: order.id, status: order.status } };
    }

    // Cashfree is the source of truth (no client signature). Confirm by fetching
    // the order status by the order_ref we created it with — that ref is bound
    // to this order, so a foreign order/payment cannot be replayed against it.
    const status = await this.gateway.getOrderStatus(order.payment.razorpayOrderId);
    if (status.orderStatus !== 'PAID') {
      throw new BadRequestException('Payment not completed yet');
    }
    const cfPaymentId = status.cfPaymentId ?? null;

    // Authoritative, race-safe capture.
    const outcome = await this.prisma.$transaction(async (tx) => {
      // C5: conditional capture — exactly one concurrent verify wins. The
      // loser sees count 0 and becomes an idempotent no-op (no duplicate
      // history row, no duplicate admin notification).
      const captured = await tx.payment.updateMany({
        where: { id: order.payment!.id, status: { not: PaymentStatus.CAPTURED } },
        data: {
          razorpayPaymentId: cfPaymentId,
          status: PaymentStatus.CAPTURED,
          capturedAt: new Date(),
        },
      });
      if (captured.count === 0) {
        return 'already_captured' as const;
      }

      // C5: only confirm if still awaiting payment. Never resurrect an order
      // that the payment-sweep already auto-cancelled (or that was refunded).
      const confirmed = await tx.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
        data: {
          status: OrderStatus.CONFIRMED,
          confirmedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (confirmed.count === 1) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: OrderStatus.PENDING_PAYMENT,
            toStatus: OrderStatus.CONFIRMED,
            notes: 'Payment captured',
          },
        });
        return 'confirmed' as const;
      }
      // Payment captured but the order is no longer PENDING_PAYMENT (paid right
      // at the auto-cancel boundary). Money was taken — flag for refund instead
      // of silently confirming a cancelled order.
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: order.status,
          notes: 'Payment captured AFTER order left PENDING_PAYMENT — needs refund/manual review',
        },
      });
      return 'captured_not_confirmed' as const;
    });

    if (outcome === 'already_captured') {
      const fresh = await this.prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      return { ok: true, alreadyCaptured: true, order: { id: order.id, status: fresh?.status } };
    }

    if (outcome === 'confirmed') {
      this.realtime.notifyAdminNewOrder(order.id);
      this.realtime.notifyOrderStatusChange(order.id, OrderStatus.CONFIRMED, order.userId);
      await this.events.emitNewOrder(order.id);
      return { ok: true, order: { id: order.id, status: OrderStatus.CONFIRMED } };
    }

    // captured_not_confirmed
    this.logger.error(
      `Payment captured for order ${order.id} but it was ${order.status} (not PENDING_PAYMENT). Refund/manual review required.`,
    );
    return {
      ok: true,
      capturedButNotConfirmed: true,
      order: { id: order.id, status: order.status },
    };
  }

  async handleWebhook(rawBody: string, signature: string, timestamp: string) {
    if (!this.gateway.verifyWebhookSignature(rawBody, signature, timestamp)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.type ?? 'UNKNOWN';
    const data = payload.data ?? {};
    const orderRef: string | undefined = data.order?.order_id;
    const cfPaymentId = data.payment?.cf_payment_id;
    const eventId =
      (cfPaymentId != null ? String(cfPaymentId) : undefined) ??
      `${eventType}-${orderRef ?? 'na'}-${payload.event_time ?? Date.now()}`;

    // Idempotency: skip if seen
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: 'cashfree', eventId } } as any,
    });
    if (existing?.processedAt) return { ok: true, duplicate: true };

    const record = await this.prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: 'cashfree', eventId } } as any,
      create: { provider: 'cashfree', eventId, eventType, payload },
      update: { eventType, payload },
    });

    try {
      switch (eventType) {
        case 'PAYMENT_SUCCESS_WEBHOOK':
          if (orderRef) await this.handlePaymentCaptured(orderRef, cfPaymentId != null ? String(cfPaymentId) : null);
          break;
        case 'PAYMENT_FAILED_WEBHOOK':
        case 'PAYMENT_USER_DROPPED_WEBHOOK':
          if (orderRef) await this.handlePaymentFailed(orderRef, data.payment?.payment_message);
          break;
        case 'REFUND_STATUS_WEBHOOK':
          await this.handleRefundProcessed(data.refund ?? {});
          break;
        default:
          this.logger.log(`Unhandled Cashfree event: ${eventType}`);
      }
      await this.prisma.webhookEvent.update({
        where: { id: record.id },
        data: { processedAt: new Date() },
      });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.prisma.webhookEvent.update({
        where: { id: record.id },
        data: { error: msg },
      });
      this.logger.error(`Webhook ${eventType} failed: ${msg}`);
      // Do NOT leak the raw internal error to the caller. Return a generic
      // 503 so Cashfree retries the (recorded) event without exposing
      // stack/DB internals.
      throw new ServiceUnavailableException('Webhook processing failed');
    }
  }

  private async handlePaymentCaptured(orderRef: string, cfPaymentId: string | null) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: orderRef },
      include: { order: true },
    });
    if (!payment || payment.status === PaymentStatus.CAPTURED) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: cfPaymentId,
          status: PaymentStatus.CAPTURED,
          capturedAt: new Date(),
        },
      });
      if (payment.order.status === OrderStatus.PENDING_PAYMENT) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CONFIRMED, confirmedAt: new Date(), version: { increment: 1 } },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: OrderStatus.PENDING_PAYMENT,
            toStatus: OrderStatus.CONFIRMED,
            notes: 'Payment captured (webhook)',
          },
        });
      }
    });
    this.realtime.notifyAdminNewOrder(payment.orderId);
    this.realtime.notifyOrderStatusChange(payment.orderId, OrderStatus.CONFIRMED, payment.order.userId);
    await this.events.emitNewOrder(payment.orderId);
  }

  private async handlePaymentFailed(orderRef: string, message?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: orderRef },
    });
    if (!payment || payment.status === PaymentStatus.CAPTURED) return;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureDescription: message ?? 'Payment failed',
      },
    });
  }

  private async handleRefundProcessed(refund: any) {
    const orderRef = refund.order_id;
    if (!orderRef || refund.refund_status !== 'SUCCESS') return;
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: orderRef },
    });
    if (!payment) return;
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundId: String(refund.refund_id ?? refund.cf_refund_id ?? ''),
          refundAmount: Number(refund.refund_amount ?? 0),
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.REFUNDED, refundedAt: new Date(), version: { increment: 1 } },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          fromStatus: OrderStatus.CANCELLED,
          toStatus: OrderStatus.REFUNDED,
          notes: 'Refund processed (webhook)',
        },
      });
    });
  }

  async refund(orderId: string, amount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order || !order.payment) throw new NotFoundException('Order/Payment not found');
    if (order.payment.method !== 'RAZORPAY') {
      throw new BadRequestException('Only online (Cashfree) payments can be auto-refunded');
    }
    if (!order.payment.razorpayOrderId || !order.payment.razorpayPaymentId) {
      throw new BadRequestException('No captured payment to refund');
    }
    // M2: only a CAPTURED payment is refundable, and the CAPTURED →
    // REFUND_PENDING transition is atomic. Two concurrent admin refunds can
    // no longer both pass the check and double-refund: exactly one wins the
    // conditional update; the loser gets count 0.
    const claimed = await this.prisma.payment.updateMany({
      where: { id: order.payment.id, status: PaymentStatus.CAPTURED },
      data: { status: PaymentStatus.REFUND_PENDING },
    });
    if (claimed.count === 0) {
      throw new BadRequestException(
        `Payment is not in a refundable state (current: ${order.payment.status})`,
      );
    }

    const refundAmount = amount ?? Number(order.payment.amount);
    // Cashfree refund_id: unique, alphanumeric/_/-, per order.
    const refundRequestId = `rf-${order.orderNumber}-${Date.now()}`;

    let refund: { refundId: string };
    try {
      refund = await this.gateway.refund({
        orderRef: order.payment.razorpayOrderId,
        amount: refundAmount,
        refundId: refundRequestId,
      });
    } catch (err) {
      // Gateway call failed — roll the claim back so it can be retried
      // instead of getting stuck in REFUND_PENDING forever.
      await this.prisma.payment.updateMany({
        where: { id: order.payment.id, status: PaymentStatus.REFUND_PENDING },
        data: { status: PaymentStatus.CAPTURED },
      });
      throw err;
    }

    await this.prisma.payment.update({
      where: { id: order.payment.id },
      data: { refundId: refund.refundId, refundAmount },
    });

    return { ok: true, refundId: refund.refundId, refundAmount };
  }

  async sweepStuckPayments() {
    // Cancel any PENDING_PAYMENT orders older than 10 minutes
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const stuck = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING_PAYMENT, placedAt: { lt: cutoff } },
      include: { payment: true },
    });

    for (const order of stuck) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id, version: order.version } as any,
            data: {
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
              cancelledReason: 'Payment timeout (auto-cancelled)',
              version: { increment: 1 },
            },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: OrderStatus.PENDING_PAYMENT,
              toStatus: OrderStatus.CANCELLED,
              notes: 'Auto-cancelled after 10 minutes',
            },
          });
          if (order.payment) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: { status: PaymentStatus.FAILED, failureDescription: 'Timeout' },
            });
          }
          // Release coupon
          const redemption = await tx.couponRedemption.findUnique({
            where: { orderId: order.id },
          });
          if (redemption) {
            await tx.coupon.update({
              where: { id: redemption.couponId },
              data: { currentUsageCount: { decrement: 1 } },
            });
            await tx.couponRedemption.delete({ where: { id: redemption.id } });
          }
        });
      } catch (err) {
        this.logger.error(`Sweep failed for order ${order.id}: ${(err as Error).message}`);
      }
    }
    return { cancelled: stuck.length };
  }
}
