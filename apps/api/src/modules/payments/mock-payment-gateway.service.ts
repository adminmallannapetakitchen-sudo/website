import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PaymentGatewayService } from './payment-gateway.interface';

@Injectable()
export class MockPaymentGatewayService implements PaymentGatewayService {
  private readonly logger = new Logger('MockPaymentGateway');

  isReady(): boolean {
    return true;
  }

  async createOrder({ amount, orderId }: { amount: number; orderId: string; orderNumber: string }) {
    this.logger.log(`[MOCK PAYMENT] Created Razorpay-style order for ${orderId}, amount ₹${amount}`);
    return {
      id: `order_mock_${randomUUID()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      keyId: 'rzp_test_mock',
    };
  }

  verifySignature(): boolean {
    return true;
  }

  async refund({ amount }: { paymentId: string; amount: number }): Promise<{ refundId: string }> {
    this.logger.log(`[MOCK PAYMENT] Refund ₹${amount}`);
    return { refundId: `rfnd_mock_${randomUUID()}` };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  publicKeyId(): string {
    return 'rzp_test_mock';
  }
}
