import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersEventBus } from './orders-event-bus.service';

// Per business rule: customer cannot cancel; only admin can.
// Allowed transitions:
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.REFUNDED],
  CANCELLED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly events: OrdersEventBus,
  ) {}

  // ─── CUSTOMER ───────────────────────────────────────────────────

  async listForCustomer(userId: string, opts: { page?: number; pageSize?: number } = {}) {
    const page = opts.page ?? 1;
    const pageSize = Math.min(opts.pageSize ?? 20, 50);
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { select: { id: true, qty: true, lineTotal: true, itemSnapshot: true, variantSnapshot: true } },
          payment: { select: { status: true, method: true } },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, pageSize };
  }

  async getOneForCustomer(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async rateOrder(userId: string, orderId: string, rating: number, comment?: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can rate an order only after it is delivered');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { rating, ratingComment: comment?.trim() || null, ratedAt: new Date() },
      select: { id: true, rating: true, ratingComment: true, ratedAt: true },
    });
  }

  // ─── ADMIN ──────────────────────────────────────────────────────

  async listForAdmin(opts: { status?: OrderStatus; search?: string; page?: number; pageSize?: number }) {
    const page = opts.page ?? 1;
    const pageSize = Math.min(opts.pageSize ?? 30, 100);
    const where: Prisma.OrderWhereInput = {};
    if (opts.status) {
      where.status = opts.status;
    } else {
      // Awaiting-payment orders aren't real orders yet (online checkout that was
      // never paid). Keep them OFF the board so they don't look confirmed/paid —
      // the payment sweep cancels abandoned ones. Still reachable via an explicit
      // status filter if ever needed.
      where.status = { not: OrderStatus.PENDING_PAYMENT };
    }
    if (opts.search) {
      where.OR = [
        { orderNumber: { contains: opts.search, mode: 'insensitive' } },
        { customerNameSnapshot: { contains: opts.search, mode: 'insensitive' } },
        { customerPhoneSnapshot: { contains: opts.search } },
      ];
    }
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: true,
          payment: { select: { status: true, method: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, pageSize };
  }

  async getOneForAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { id: true, name: true, email: true } } } },
        payment: true,
        user: { select: { id: true, name: true, email: true, phoneE164: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus, actorUserId: string, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const timestamps: Partial<Prisma.OrderUpdateInput> = {};
    const now = new Date();
    if (newStatus === OrderStatus.CONFIRMED) timestamps.confirmedAt = now;
    if (newStatus === OrderStatus.PREPARING) timestamps.preparingAt = now;
    if (newStatus === OrderStatus.OUT_FOR_DELIVERY) timestamps.outForDeliveryAt = now;
    if (newStatus === OrderStatus.DELIVERED) timestamps.deliveredAt = now;
    if (newStatus === OrderStatus.CANCELLED) {
      timestamps.cancelledAt = now;
      timestamps.cancelledReason = notes;
    }
    if (newStatus === OrderStatus.REFUNDED) timestamps.refundedAt = now;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Optimistic concurrency: bump version, fail if mismatched
      const result = await tx.order.updateMany({
        where: { id: orderId, version: order.version },
        data: { status: newStatus, version: order.version + 1, ...timestamps as any },
      });
      if (result.count === 0) {
        throw new BadRequestException('Order was modified concurrently. Refresh and try again.');
      }
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          actorUserId,
          notes,
        },
      });
      return tx.order.findUnique({ where: { id: orderId } });
    });

    // Notify customer + admins
    this.realtime.notifyOrderStatusChange(orderId, newStatus, order.userId);
    await this.events.emitStatusChange(orderId, newStatus);

    return updated;
  }
}
