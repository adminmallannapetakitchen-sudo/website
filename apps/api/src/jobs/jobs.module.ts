import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { PushProcessor } from './push.processor';
import { PaymentSweepScheduler } from './payment-sweep.scheduler';
import { PaymentsModule } from '../modules/payments/payments.module';
import { PushModule } from '../modules/push/push.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'emails' }, { name: 'push' }),
    PaymentsModule,
    PushModule,
  ],
  providers: [EmailProcessor, PushProcessor, PaymentSweepScheduler],
})
export class JobsModule {}
