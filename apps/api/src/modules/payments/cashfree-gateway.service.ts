import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import type {
  CashfreeMode,
  CreateOrderResult,
  OrderStatusResult,
  PaymentGatewayService,
} from './payment-gateway.interface';

/**
 * Cashfree Payment Gateway (PG) via the Orders API.
 * Docs: https://docs.cashfree.com/reference/pg-new-apis-endpoint
 *
 * Flow: create order -> get payment_session_id -> client pays with the JS SDK
 * -> we confirm by fetching the order status (no client-side signature).
 */
@Injectable()
export class CashfreeGatewayService implements PaymentGatewayService {
  private readonly logger = new Logger('CashfreeGateway');
  private readonly appId: string;
  private readonly secret: string;
  private readonly envMode: CashfreeMode;
  private readonly apiVersion: string;
  private readonly base: string;
  private readonly webUrl: string;
  private readonly publicApiUrl: string;

  constructor(private readonly config: ConfigService) {
    this.appId = config.get<string>('cashfree.appId') ?? '';
    this.secret = config.get<string>('cashfree.secretKey') ?? '';
    this.envMode = (config.get<string>('cashfree.env') as CashfreeMode) ?? 'sandbox';
    this.apiVersion = config.get<string>('cashfree.apiVersion') ?? '2023-08-01';
    this.base =
      this.envMode === 'production'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
    this.webUrl = config.get<string>('webUrl') ?? 'http://localhost:3000';
    this.publicApiUrl = config.get<string>('publicApiUrl') ?? '';
  }

  isReady(): boolean {
    return !!(this.appId && this.secret);
  }

  mode(): CashfreeMode {
    return this.envMode;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-version': this.apiVersion,
      'x-client-id': this.appId,
      'x-client-secret': this.secret,
    };
  }

  async createOrder({
    orderRef,
    internalOrderId,
    amount,
    customer,
  }: {
    orderRef: string;
    internalOrderId: string;
    amount: number;
    customer: { id: string; name: string; phone: string; email?: string | null };
  }): Promise<CreateOrderResult> {
    const body: Record<string, unknown> = {
      order_id: orderRef,
      order_amount: Number(amount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        ...(customer.email ? { customer_email: customer.email } : {}),
      },
      order_meta: {
        // Include the internal order id so a redirect-back (mobile UPI) can
        // verify + deep-link to the order, not just rely on the webhook.
        return_url: `${this.webUrl}/checkout/success?orderId=${encodeURIComponent(internalOrderId)}&orderNumber=${encodeURIComponent(orderRef)}`,
        ...(this.publicApiUrl ? { notify_url: `${this.publicApiUrl}/webhooks/cashfree` } : {}),
      },
    };

    const res = await fetch(`${this.base}/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`createOrder failed (${res.status}): ${JSON.stringify(data)}`);
      throw new Error(data?.message ?? 'Cashfree order creation failed');
    }
    return {
      paymentSessionId: data.payment_session_id,
      cfOrderId: String(data.cf_order_id ?? ''),
      orderRef,
      mode: this.envMode,
    };
  }

  async getOrderStatus(orderRef: string): Promise<OrderStatusResult> {
    const res = await fetch(`${this.base}/orders/${encodeURIComponent(orderRef)}`, {
      headers: this.headers(),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`getOrderStatus failed (${res.status}): ${JSON.stringify(data)}`);
      throw new Error(data?.message ?? 'Cashfree order fetch failed');
    }

    let cfPaymentId: string | null = null;
    if (data.order_status === 'PAID') {
      try {
        const pr = await fetch(`${this.base}/orders/${encodeURIComponent(orderRef)}/payments`, {
          headers: this.headers(),
        });
        const payments: any = await pr.json().catch(() => []);
        if (Array.isArray(payments) && payments.length) {
          const ok = payments.find((p: any) => p.payment_status === 'SUCCESS') ?? payments[0];
          if (ok?.cf_payment_id != null) cfPaymentId = String(ok.cf_payment_id);
        }
      } catch {
        /* best effort — order_status is authoritative for confirmation */
      }
    }

    return {
      orderStatus: data.order_status,
      paymentSessionId: data.payment_session_id ?? null,
      cfPaymentId,
    };
  }

  async refund({
    orderRef,
    amount,
    refundId,
  }: {
    orderRef: string;
    amount: number;
    refundId: string;
  }): Promise<{ refundId: string }> {
    const res = await fetch(`${this.base}/orders/${encodeURIComponent(orderRef)}/refunds`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        refund_amount: Number(amount.toFixed(2)),
        refund_id: refundId,
        refund_note: 'Refund processed by Mallannapeta Kitchen',
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`refund failed (${res.status}): ${JSON.stringify(data)}`);
      throw new Error(data?.message ?? 'Cashfree refund failed');
    }
    return { refundId: String(data.refund_id ?? refundId) };
  }

  verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean {
    if (!this.secret || !signature || !timestamp) return false;
    const expected = createHmac('sha256', this.secret)
      .update(timestamp + rawBody)
      .digest('base64');
    return expected === signature;
  }
}
