import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private ready = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const pub = this.config.get<string>('vapid.publicKey');
    const priv = this.config.get<string>('vapid.privateKey');
    const subject = this.config.get<string>('vapid.subject');
    if (pub && priv && subject) {
      webpush.setVapidDetails(subject, pub, priv);
      this.ready = true;
    } else {
      this.logger.warn('Web Push not configured (VAPID keys missing)');
    }
  }

  getPublicKey() {
    return this.config.get<string>('vapid.publicKey') ?? null;
  }

  async subscribe(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent,
      },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent, userId },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { ok: true };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.ready) return { sent: 0, ready: false };
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
        } else {
          this.logger.warn(`Push failed: ${err.statusCode} ${err.body}`);
        }
      }
    }
    return { sent, ready: true };
  }

  async fanOutSundaySpecial(payload: PushPayload, batchSize = 100) {
    if (!this.ready) return { sent: 0, ready: false };
    const recipients = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        notificationPreference: { sundaySpecialAlerts: true },
        pushSubscriptions: { some: {} },
      },
      select: { id: true },
    });

    let total = 0;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const slice = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(slice.map((r) => this.sendToUser(r.id, payload)));
      total += results.reduce((s, r) => s + (r.status === 'fulfilled' ? r.value.sent : 0), 0);
    }
    return { sent: total, recipients: recipients.length, ready: true };
  }
}
