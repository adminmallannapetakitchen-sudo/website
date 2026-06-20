import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CashfreeMode,
  CreateOrderResult,
  OrderStatusResult,
  PaymentGatewayService,
} from './payment-gateway.interface';

/**
 * Dev/test only. Pretends every order is instantly PAID and accepts any
 * webhook. The payment session id is prefixed `mock_session_` so the frontend
 * knows to skip the real Cashfree SDK and confirm directly. Never used in
 * production (the module factory refuses to boot it there).
 */
@Injectable()
export class MockPaymentGatewayService implements PaymentGatewayService {
  private readonly logger = new Logger('MockPaymentGateway');

  isReady(): boolean {
    return true;
  }

  mode(): CashfreeMode {
    return 'sandbox';
  }

  async createOrder({ orderRef, amount }: { orderRef: string; internalOrderId?: string; amount: number }): Promise<CreateOrderResult> {
    this.logger.log(`[MOCK PAYMENT] Created order ${orderRef}, amount ₹${amount}`);
    return {
      paymentSessionId: `mock_session_${randomUUID()}`,
      cfOrderId: `mock_cf_${randomUUID()}`,
      orderRef,
      mode: 'sandbox',
    };
  }

  async getOrderStatus(orderRef: string): Promise<OrderStatusResult> {
    return { orderStatus: 'PAID', cfPaymentId: `mock_pay_${randomUUID()}`, paymentSessionId: null };
  }

  async refund({ refundId }: { refundId: string }): Promise<{ refundId: string }> {
    this.logger.log(`[MOCK PAYMENT] Refund ${refundId}`);
    return { refundId: refundId || `mock_rfnd_${randomUUID()}` };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }
}
