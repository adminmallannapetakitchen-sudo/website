import { Logger, Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { AdminPaymentsController, PaymentsController } from './payments.controller';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import { RazorpayGatewayService } from './razorpay-gateway.service';
import { MockPaymentGatewayService } from './mock-payment-gateway.service';
import { OrdersModule } from '../orders/orders.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [forwardRef(() => OrdersModule), RealtimeModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => {
        const logger = new Logger('PaymentGateway');
        const env = cs.get<string>('env');
        const keyId = cs.get<string>('razorpay.keyId');
        const keySecret = cs.get<string>('razorpay.keySecret');

        if (keyId && keySecret) {
          logger.log('Using RazorpayGatewayService (live signature verification)');
          return new RazorpayGatewayService(cs);
        }

        // C4: the mock gateway accepts ANY signature/webhook. It must never be
        // reachable in production — fail fast at boot instead of silently
        // letting anyone confirm unpaid orders for free.
        if (env === 'production') {
          throw new Error(
            'FATAL: Razorpay credentials are missing in production. ' +
              'Refusing to start with the mock payment gateway (it accepts any signature). ' +
              'Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET.',
          );
        }

        logger.warn(
          '⚠️  Using MockPaymentGatewayService — signatures/webhooks are NOT verified. ' +
            'Dev/test only. This will refuse to load in production.',
        );
        return new MockPaymentGatewayService();
      },
    },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
