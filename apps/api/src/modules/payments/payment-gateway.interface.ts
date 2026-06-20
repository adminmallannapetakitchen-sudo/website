export type CashfreeMode = 'sandbox' | 'production';

export interface CreateOrderResult {
  /** Used by the frontend JS SDK to open checkout. */
  paymentSessionId: string;
  /** Cashfree's internal order id. */
  cfOrderId: string;
  /** The merchant order_id we sent (= our orderNumber). Stored for matching. */
  orderRef: string;
  mode: CashfreeMode;
}

export interface OrderStatusResult {
  /** PAID | ACTIVE | EXPIRED | TERMINATED | TERMINATION_REQUESTED | ... */
  orderStatus: string;
  paymentSessionId?: string | null;
  cfPaymentId?: string | null;
}

export interface PaymentGatewayService {
  isReady(): boolean;
  mode(): CashfreeMode;
  /** Create a Cashfree order and return the payment_session_id the client uses. */
  createOrder(opts: {
    orderRef: string;
    internalOrderId: string;
    amount: number;
    customer: { id: string; name: string; phone: string; email?: string | null };
  }): Promise<CreateOrderResult>;
  /** Source of truth for whether a payment succeeded (Cashfree has no client signature). */
  getOrderStatus(orderRef: string): Promise<OrderStatusResult>;
  refund(opts: { orderRef: string; amount: number; refundId: string }): Promise<{ refundId: string }>;
  /** Cashfree signs webhooks with the API secret: base64(HMAC-SHA256(timestamp + rawBody)). */
  verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
