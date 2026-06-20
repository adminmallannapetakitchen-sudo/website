import { Logger, Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { AdminPaymentsController, PaymentsController } from './payments.controller';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import { CashfreeGatewayService } from './cashfree-gateway.service';
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
        const appId = cs.get<string>('cashfree.appId');
        const secret = cs.get<string>('cashfree.secretKey');

        if (appId && secret) {
          logger.log(`Using CashfreeGatewayService (${cs.get<string>('cashfree.env')})`);
          return new CashfreeGatewayService(cs);
        }

        // C4: the mock gateway treats every order as PAID and accepts any
        // webhook. It must never be reachable in production — fail fast at boot
        // instead of silently letting anyone confirm unpaid orders for free.
        if (env === 'production') {
          throw new Error(
            'FATAL: Cashfree credentials are missing in production. ' +
              'Refusing to start with the mock payment gateway (it confirms any order). ' +
              'Set CASHFREE_APP_ID / CASHFREE_SECRET_KEY (and CASHFREE_ENV).',
          );
        }

        logger.warn(
          '⚠️  Using MockPaymentGatewayService — payments are auto-confirmed and webhooks are NOT verified. ' +
            'Dev/test only. This will refuse to load in production.',
        );
        return new MockPaymentGatewayService();
      },
    },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
