import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  API_PREFIX: z.string().default('api/v1'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().optional().default(''),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),

  MSG91_AUTH_KEY: z.string().optional().default(''),
  MSG91_SENDER_ID: z.string().optional().default(''),
  MSG91_TEMPLATE_ID: z.string().optional().default(''),
  MSG91_OTP_LENGTH: z.string().default('6'),
  MSG91_OTP_EXPIRY_MINUTES: z.string().default('10'),

  CASHFREE_APP_ID: z.string().optional().default(''),
  CASHFREE_SECRET_KEY: z.string().optional().default(''),
  CASHFREE_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  CASHFREE_API_VERSION: z.string().default('2023-08-01'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM: z.string().optional().default('noreply@example.com'),

  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().optional().default('mailto:noreply@example.com'),

  SENTRY_DSN: z.string().optional().default(''),
});

const envSchemaWithProdRules = envSchema.superRefine((env, ctx) => {
  // C4: In production we must NOT fall back to the permissive mock payment
  // gateway. Cashfree credentials are mandatory so the payment trust boundary
  // fails closed instead of confirming any order for free.
  if (env.NODE_ENV === 'production') {
    const required: Array<keyof typeof env> = [
      'CASHFREE_APP_ID',
      'CASHFREE_SECRET_KEY',
    ];
    for (const key of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required when NODE_ENV=production (payment gateway must not fall back to mock)`,
        });
      }
    }
  }
});

export function validateEnv(raw: Record<string, unknown>) {
  const parsed = envSchemaWithProdRules.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment variables: ${JSON.stringify(errors, null, 2)}`);
  }
  return parsed.data;
}
