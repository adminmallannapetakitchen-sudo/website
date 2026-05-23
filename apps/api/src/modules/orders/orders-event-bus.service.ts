import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersEventBus {
  constructor(
    @InjectQueue('emails') private readonly emails: Queue,
    @InjectQueue('push') private readonly push: Queue,
  ) {}

  async emitNewOrder(orderId: string) {
    await Promise.all([
      this.emails.add('order-confirmation', { orderId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }),
    ]);
  }

  async emitStatusChange(orderId: string, status: OrderStatus) {
    await this.push.add(
      'order-status',
      { orderId, status },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}
