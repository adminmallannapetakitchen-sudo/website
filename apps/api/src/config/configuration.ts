export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  // Public base URL of THIS API (incl. /api/v1), used for Cashfree notify_url.
  publicApiUrl: process.env.PUBLIC_API_URL ?? '',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((o) => o.trim()),

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL!,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },

  msg91: {
    authKey: process.env.MSG91_AUTH_KEY ?? '',
    senderId: process.env.MSG91_SENDER_ID ?? '',
    templateId: process.env.MSG91_TEMPLATE_ID ?? '',
    otpLength: parseInt(process.env.MSG91_OTP_LENGTH ?? '6', 10),
    otpExpiryMinutes: parseInt(process.env.MSG91_OTP_EXPIRY_MINUTES ?? '10', 10),
  },

  cashfree: {
    appId: process.env.CASHFREE_APP_ID ?? '',
    secretKey: process.env.CASHFREE_SECRET_KEY ?? '',
    env: process.env.CASHFREE_ENV ?? 'sandbox', // sandbox | production
    apiVersion: process.env.CASHFREE_API_VERSION ?? '2023-08-01',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.RESEND_FROM ?? 'noreply@example.com',
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? '',
    privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
    subject: process.env.VAPID_SUBJECT ?? 'mailto:noreply@example.com',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN ?? '',
  },
});

export type AppConfig = ReturnType<typeof import('./configuration').default>;
