import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import Razorpay from 'razorpay';
import type { PaymentGatewayService } from './payment-gateway.interface';

@Injectable()
export class RazorpayGatewayService implements PaymentGatewayService {
  private readonly logger = new Logger('RazorpayGateway');
  private client: Razorpay | null = null;

  constructor(private readonly config: ConfigService) {
    const keyId = this.config.get<string>('razorpay.keyId');
    const keySecret = this.config.get<string>('razorpay.keySecret');
    if (keyId && keySecret) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  isReady(): boolean {
    return !!this.client;
  }

  async createOrder({ amount, orderId, orderNumber }: { amount: number; orderId: string; orderNumber: string }) {
    if (!this.client) throw new Error('Razorpay not configured');
    const rp = await this.client.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderNumber,
      notes: { internalOrderId: orderId },
    });
    return {
      id: rp.id,
      amount: Number(rp.amount),
      currency: rp.currency,
      keyId: this.config.get<string>('razorpay.keyId')!,
    };
  }

  verifySignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    const secret = this.config.get<string>('razorpay.keySecret');
    if (!secret) return false;
    const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return expected === signature;
  }

  async refund({ paymentId, amount }: { paymentId: string; amount: number }): Promise<{ refundId: string }> {
    if (!this.client) throw new Error('Razorpay not configured');
    const refund = await this.client.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
    });
    return { refundId: refund.id };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = this.config.get<string>('razorpay.webhookSecret');
    if (!secret) return false;
    if (!signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signature;
  }

  publicKeyId(): string {
    return this.config.get<string>('razorpay.keyId')!;
  }
}
