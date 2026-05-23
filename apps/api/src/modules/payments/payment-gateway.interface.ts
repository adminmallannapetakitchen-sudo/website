export interface PaymentGatewayService {
  isReady(): boolean;
  createOrder(opts: { amount: number; orderId: string; orderNumber: string }): Promise<{
    id: string;
    amount: number;
    currency: string;
    keyId: string;
  }>;
  verifySignature(opts: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean;
  refund(opts: { paymentId: string; amount: number }): Promise<{ refundId: string }>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  /** Public (client-safe) key id, used to reconstruct the checkout payload on idempotent replay. */
  publicKeyId(): string;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
