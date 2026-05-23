import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // M4: "revenue" must only include realized sales. The old filter
    // (status != CANCELLED) counted unpaid PENDING_PAYMENT and REFUNDED
    // orders as revenue, inflating it well above the sales report.
    const REALIZED_STATUSES = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

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
          where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] } },
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
    const orders = await this.prisma.order.findMany({
      where: {
        placedAt: { gte: opts.from, lte: opts.to },
        status: { in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY] },
      },
      select: { placedAt: true, total: true, paymentMethod: true },
      orderBy: { placedAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, { date: string; orders: number; revenue: number }>();
    for (const o of orders) {
      const d = o.placedAt.toISOString().slice(0, 10);
      const slot = byDay.get(d) ?? { date: d, orders: 0, revenue: 0 };
      slot.orders++;
      slot.revenue += Number(o.total);
      byDay.set(d, slot);
    }

    return {
      from: opts.from,
      to: opts.to,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + Number(o.total), 0),
      daily: Array.from(byDay.values()),
    };
  }

  async topItemsReport(opts: { from: Date; to: Date; limit?: number }) {
    const limit = opts.limit ?? 10;
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: { gte: opts.from, lte: opts.to },
          status: { in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY] },
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
      where: { createdAt: { gte: opts.from, lte: opts.to } },
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
