import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';

import { PrismaModule } from './prisma/prisma.module';
import { LockModule } from './common/lock/lock.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MenuModule } from './modules/menu/menu.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { KitchenSettingsModule } from './modules/kitchen-settings/kitchen-settings.module';
import { PincodesModule } from './modules/pincodes/pincodes.module';
import { CartModule } from './modules/cart/cart.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { SundaySpecialModule } from './modules/sunday-special/sunday-special.module';
import { PushModule } from './modules/push/push.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { MediaModule } from './modules/media/media.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env'],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
        autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' },
      },
    }),

    // L1: the old 5 req/s · 100/min per-IP global limit throttled customers
    // sharing a mobile/Wi-Fi NAT against each other across every endpoint.
    // Loosened to sane defaults; sensitive auth routes are individually
    // tightened with @Throttle and the Razorpay webhook is @SkipThrottle.
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 25 },
      { name: 'default', ttl: 60_000, limit: 300 },
    ]),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => {
        const url = cs.get<string>('redis.url')!;
        return { connection: { url } };
      },
    }),

    PrismaModule,
    LockModule,
    AuthModule,
    UsersModule,
    MenuModule,
    CategoriesModule,
    KitchenSettingsModule,
    PincodesModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    SundaySpecialModule,
    PushModule,
    RealtimeModule,
    ReportsModule,
    AuditLogsModule,
    WebhooksModule,
    HealthModule,
    JobsModule,
    MailModule,
    MediaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
