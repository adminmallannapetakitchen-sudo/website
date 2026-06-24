export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export async function onRequestError(...args: unknown[]) {
  const Sentry = await import('@sentry/nextjs')
  // captureRequestError exists on supported versions; guard so it never throws.
  const fn = (Sentry as unknown as { captureRequestError?: (...a: unknown[]) => void })
    .captureRequestError
  if (typeof fn === 'function') fn(...args)
}
