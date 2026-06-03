import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// Realized sales = everything from CONFIRMED onwards (incl. COD), excluding
// unpaid PENDING_PAYMENT, CANCELLED and REFUNDED. Shared by the dashboard and
// the reports so the two never disagree.
const REALIZED_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The `to` date arrives as midnight; make the range inclusive of that whole day. */
  private endOfDay(to: Date): Date {
    return new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  async dashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, pendingOrders, totalCustomers] =
      await this.prisma.$transaction([
        this.prisma.order.aggregate({
          where: { placedAt: { gte: todayStart }, status: { in: REALIZED_STATUSES } },
          _count: { _all: true },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: { placedAt: { gte: weekStart }, status: { in: REALIZED_STATUSES } },
          _count: { _all: true },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: { placedAt: { gte: monthStart }, status: { in: REALIZED_STATUSES } },
          _count: { _all: true },
          _sum: { total: true },
        }),
        this.prisma.order.count({
          where: {
            status: {
              in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY],
            },
          },
        }),
        this.prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      ]);

    return {
      today: { count: todayOrders._count._all, revenue: Number(todayOrders._sum.total ?? 0) },
      week: { count: weekOrders._count._all, revenue: Number(weekOrders._sum.total ?? 0) },
      month: { count: monthOrders._count._all, revenue: Number(monthOrders._sum.total ?? 0) },
      activeOrders: pendingOrders,
      totalCustomers,
    };
  }

  async salesReport(opts: { from: Date; to: Date }) {
    const to = this.endOfDay(opts.to);
    const orders = await this.prisma.order.findMany({
      where: {
        placedAt: { gte: opts.from, lte: to },
        status: { in: REALIZED_STATUSES },
      },
      select: { placedAt: true, total: true, paymentMethod: true },
      orderBy: { placedAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, { date: string; orders: number; revenue: number }>();
    const byPaymentMethod = { RAZORPAY: { orders: 0, revenue: 0 }, COD: { orders: 0, revenue: 0 } };
    for (const o of orders) {
      const d = o.placedAt.toISOString().slice(0, 10);
      const slot = byDay.get(d) ?? { date: d, orders: 0, revenue: 0 };
      slot.orders++;
      slot.revenue += Number(o.total);
      byDay.set(d, slot);

      const pm = byPaymentMethod[o.paymentMethod];
      pm.orders++;
      pm.revenue += Number(o.total);
    }

    return {
      from: opts.from,
      to,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + Number(o.total), 0),
      daily: Array.from(byDay.values()),
      byPaymentMethod,
    };
  }

  async topItemsReport(opts: { from: Date; to: Date; limit?: number }) {
    const limit = opts.limit ?? 10;
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: { gte: opts.from, lte: this.endOfDay(opts.to) },
          status: { in: REALIZED_STATUSES },
        },
      },
      select: { menuItemId: true, qty: true, lineTotal: true, itemSnapshot: true },
    });

    const grouped = new Map<string, { menuItemId: string; name: string; qty: number; revenue: number }>();
    for (const it of items) {
      const slot = grouped.get(it.menuItemId) ?? {
        menuItemId: it.menuItemId,
        name: (it.itemSnapshot as any)?.name ?? 'Unknown',
        qty: 0,
        revenue: 0,
      };
      slot.qty += it.qty;
      slot.revenue += Number(it.lineTotal);
      grouped.set(it.menuItemId, slot);
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  }

  async customersReport(opts: { search?: string; page?: number; pageSize?: number }) {
    const page = opts.page ?? 1;
    const pageSize = Math.min(opts.pageSize ?? 25, 100);
    const where: any = { role: 'CUSTOMER', deletedAt: null };
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { phoneE164: { contains: opts.search } },
      ];
    }
    const [customers, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phoneE164: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { customers, total, page, pageSize };
  }

  async couponPerformance(opts: { from: Date; to: Date }) {
    const usage = await this.prisma.couponRedemption.groupBy({
      by: ['couponId'],
      where: { createdAt: { gte: opts.from, lte: this.endOfDay(opts.to) } },
      _count: { _all: true },
      _sum: { discountApplied: true },
    });
    if (usage.length === 0) return [];

    const coupons = await this.prisma.coupon.findMany({
      where: { id: { in: usage.map((u) => u.couponId) } },
      select: { id: true, code: true, type: true, value: true },
    });
    return usage.map((u) => ({
      ...coupons.find((c) => c.id === u.couponId),
      redemptions: u._count._all,
      totalDiscount: Number(u._sum.discountApplied ?? 0),
    }));
  }
}
