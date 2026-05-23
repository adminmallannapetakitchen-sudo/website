import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../modules/mail/mail.service';

@Processor('emails', { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'order-confirmation') {
      await this.handleOrderConfirmation(job.data.orderId);
    } else if (job.name === 'password-reset') {
      await this.mail.sendPasswordReset({ to: job.data.email, resetLink: job.data.link });
    }
  }

  private async handleOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true } } },
    });
    if (!order || !order.user?.email) return;

    const address = order.addressSnapshot as any;
    await this.mail.sendOrderConfirmation({
      to: order.user.email,
      orderNumber: order.orderNumber,
      customerName: order.customerNameSnapshot,
      items: order.items.map((i) => ({
        name: `${(i.itemSnapshot as any).name}${(i.variantSnapshot as any)?.label ? ` (${(i.variantSnapshot as any).label})` : ''}`,
        qty: i.qty,
        lineTotal: Number(i.lineTotal),
      })),
      total: Number(order.total),
      deliveryFee: Number(order.deliveryFee),
      address: [address.line1, address.line2, address.city, address.pincode].filter(Boolean).join(', '),
    });
  }
}
