import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../modules/push/push.service';

const STATUS_TITLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Payment pending',
  CONFIRMED: 'Order confirmed ✅',
  PREPARING: '👨‍🍳 Your order is being prepared',
  OUT_FOR_DELIVERY: '🛵 Out for delivery',
  DELIVERED: '🎉 Delivered — enjoy your meal!',
  CANCELLED: 'Order cancelled',
  REFUNDED: 'Refund processed',
};

@Processor('push', { concurrency: 5 })
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'order-status') {
      await this.handleOrderStatus(job.data.orderId, job.data.status);
    } else if (job.name === 'sunday-special-fan-out') {
      await this.push.fanOutSundaySpecial({
        title: job.data.title,
        body: job.data.body,
        url: job.data.url,
        icon: '/logo.jpeg',
        tag: `sunday-${job.data.sundaySpecialId}`,
      });
    }
  }

  private async handleOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, orderNumber: true, status: true },
    });
    if (!order) return;
    await this.push.sendToUser(order.userId, {
      title: STATUS_TITLES[status],
      body: `Order ${order.orderNumber}`,
      icon: '/logo.jpeg',
      tag: `order-${order.id}`,
      url: `/account/orders/${order.id}`,
    });
  }
}
