import { Module } from '@nestjs/common';
import { CheckoutModule } from '../checkout/checkout.module';
import { CouponsService } from './coupons.service';
import { AdminCouponsController, CouponsController } from './coupons.controller';

@Module({
  imports: [CheckoutModule],
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
