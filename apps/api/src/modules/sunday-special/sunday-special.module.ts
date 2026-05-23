import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SundaySpecialService } from './sunday-special.service';
import {
  AdminSundaySpecialController,
  SundaySpecialController,
} from './sunday-special.controller';
import { SundaySpecialScheduler } from './sunday-special.scheduler';

@Module({
  imports: [BullModule.registerQueue({ name: 'push' })],
  controllers: [SundaySpecialController, AdminSundaySpecialController],
  providers: [SundaySpecialService, SundaySpecialScheduler],
  exports: [SundaySpecialService],
})
export class SundaySpecialModule {}
