import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersService } from './orders.service';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersEventBus } from './orders-event-bus.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    forwardRef(() => RealtimeModule),
    BullModule.registerQueue({ name: 'emails' }, { name: 'push' }),
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrdersEventBus],
  exports: [OrdersService, OrdersEventBus],
})
export class OrdersModule {}
