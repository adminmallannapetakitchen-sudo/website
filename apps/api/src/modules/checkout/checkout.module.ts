import { Module, forwardRef } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { PricingService } from './pricing.service';
import { PaymentsModule } from '../payments/payments.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [forwardRef(() => PaymentsModule), RealtimeModule, forwardRef(() => OrdersModule)],
  controllers: [CheckoutController],
  providers: [CheckoutService, PricingService],
  exports: [PricingService, CheckoutService],
})
export class CheckoutModule {}
