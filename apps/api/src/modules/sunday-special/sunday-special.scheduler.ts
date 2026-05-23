import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisLockService } from '../../common/lock/redis-lock.service';

@Injectable()
export class SundaySpecialScheduler {
  private readonly logger = new Logger('SundaySpecialScheduler');

  constructor(
    private readonly prisma: PrismaService,
    private readonly lock: RedisLockService,
    @InjectQueue('push') private readonly pushQueue: Queue,
  ) {}

  // Sunday 8 AM IST = 02:30 UTC
  @Cron('30 2 * * 0', { timeZone: 'UTC' })
  async sundayMorningFanOut() {
    // H4: leader lock so only one instance fans out per tick.
    await this.lock.withLock('sunday-special-fanout', 10 * 60 * 1000, async () => {
      this.logger.log('Sunday Special fan-out triggered');

      // Find today's active special (use IST date)
      const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const sunday = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));

      // There can now be several specials for the same Sunday.
      const specials = await this.prisma.sundaySpecial.findMany({
        where: { weekStarting: sunday, isActive: true, notificationSentAt: null },
        include: { menuItem: true },
        orderBy: { createdAt: 'asc' },
      });

      if (specials.length === 0) {
        this.logger.log('No active Sunday Special for today, or notification already sent');
        return;
      }

      // H4: atomically CLAIM every unsent special for this Sunday before
      // enqueuing. Only the run whose updateMany actually claims rows sends
      // the (single) mass push — no duplicate fan-out.
      const claim = await this.prisma.sundaySpecial.updateMany({
        where: { weekStarting: sunday, isActive: true, notificationSentAt: null },
        data: { notificationSentAt: new Date() },
      });
      if (claim.count === 0) {
        this.logger.log('Sunday Specials already claimed by another run — skipping fan-out');
        return;
      }

      const title = specials[0].bannerHeadline ?? 'This Sunday Only!';
      const body =
        specials.length === 1
          ? `${specials[0].menuItem.name} at special price ₹${specials[0].specialPrice}`
          : `${specials.length} Sunday specials are live — ${specials
              .map((s) => s.menuItem.name)
              .join(', ')}`;

      await this.pushQueue.add(
        'sunday-special-fan-out',
        {
          sundaySpecialId: specials[0].id,
          title,
          body,
          url: '/sunday-special',
        },
        { attempts: 3 },
      );
    });
  }
}
