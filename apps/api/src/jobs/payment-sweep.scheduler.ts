import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from '../modules/payments/payments.service';
import { RedisLockService } from '../common/lock/redis-lock.service';

@Injectable()
export class PaymentSweepScheduler {
  private readonly logger = new Logger('PaymentSweep');

  constructor(
    private readonly payments: PaymentsService,
    private readonly lock: RedisLockService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep() {
    // H4: only one instance sweeps per tick. TTL < cron interval so a dead
    // holder never blocks the next run.
    await this.lock.withLock('payment-sweep', 4 * 60 * 1000, async () => {
      const result = await this.payments.sweepStuckPayments();
      if (result.cancelled > 0) {
        this.logger.log(`Cancelled ${result.cancelled} stuck PENDING_PAYMENT orders`);
      }
    });
  }
}
