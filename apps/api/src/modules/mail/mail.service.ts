import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: Resend | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('resend.apiKey');
    if (apiKey) this.client = new Resend(apiKey);
    else this.logger.warn('Resend not configured');
  }

  private from() {
    return this.config.get<string>('resend.from')!;
  }

  async sendOrderConfirmation(opts: {
    to: string;
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; qty: number; lineTotal: number }>;
    total: number;
    deliveryFee: number;
    address: string;
  }) {
    if (!this.client) return { skipped: true };
    const itemsHtml = opts.items
      .map((i) => `<tr><td>${i.name} × ${i.qty}</td><td style="text-align:right">₹${i.lineTotal.toFixed(2)}</td></tr>`)
      .join('');
    const html = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FFFAF0">
        <h2 style="color:#B8332A">Thanks for your order, ${opts.customerName}!</h2>
        <p>Order <b>${opts.orderNumber}</b> confirmed.</p>
        <table style="width:100%;border-collapse:collapse">${itemsHtml}
          <tr><td>Delivery fee</td><td style="text-align:right">₹${opts.deliveryFee.toFixed(2)}</td></tr>
          <tr><td style="border-top:1px solid #ddd;padding-top:8px"><b>Total</b></td>
              <td style="text-align:right;border-top:1px solid #ddd;padding-top:8px"><b>₹${opts.total.toFixed(2)}</b></td></tr>
        </table>
        <p style="margin-top:16px"><b>Delivering to:</b><br>${opts.address}</p>
        <p style="color:#666;font-size:12px;margin-top:24px">Mallannapeta Kitchen · Jagtial, Telangana</p>
      </div>
    `;

    return this.client.emails.send({
      from: this.from(),
      to: opts.to,
      subject: `Order ${opts.orderNumber} confirmed — Mallannapeta Kitchen`,
      html,
    });
  }

  async sendPasswordReset(opts: { to: string; resetLink: string }) {
    if (!this.client) return { skipped: true };
    const html = `
      <div style="font-family:Inter,sans-serif;padding:24px;max-width:600px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. It expires in 1 hour.</p>
        <a href="${opts.resetLink}" style="display:inline-block;padding:12px 24px;background:#B8332A;color:#fff;text-decoration:none;border-radius:6px">Reset password</a>
        <p style="color:#666;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
      </div>
    `;
    return this.client.emails.send({
      from: this.from(),
      to: opts.to,
      subject: 'Reset your Mallannapeta Kitchen password',
      html,
    });
  }
}
