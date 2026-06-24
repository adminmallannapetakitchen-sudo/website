import * as Sentry from '@sentry/nextjs'

// Browser error monitoring. No-op until NEXT_PUBLIC_SENTRY_DSN is set, so local
// and unconfigured deploys stay completely silent.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
}
