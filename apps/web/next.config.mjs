import { withSentryConfig } from '@sentry/nextjs'

// Content-Security-Policy covering every origin the app actually talks to:
// self, Cashfree (SDK + checkout frames), Google sign-in, Cloudinary/Unsplash
// images, Google Fonts, and the Railway API (HTTPS + WebSocket).
// Shipped as REPORT-ONLY first: it blocks nothing (so it can't break the live
// payment/login flows) but logs any violation to the browser console. After
// verifying the console is clean on checkout + Google login, switch the header
// key below from 'Content-Security-Policy-Report-Only' to 'Content-Security-Policy'.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cashfree.com https://sdk.cashfree.com https://accounts.google.com https://apis.google.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.cashfree.com https://*.googleusercontent.com",
  "connect-src 'self' https://api-production-7127.up.railway.app wss://api-production-7127.up.railway.app https://*.cashfree.com https://accounts.google.com https://fonts.googleapis.com https://fonts.gstatic.com",
  "frame-src 'self' https://*.cashfree.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats and cache optimized images aggressively (dish photos
    // rarely change). Cuts image bytes ~30-50% on supported browsers.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    instrumentationHook: true,
  },
  // Safe, non-breaking security headers for every page (the Next app has no
  // helmet like the API does). A strict Content-Security-Policy is intentionally
  // left out here — it needs testing against Cashfree/Cloudinary/Google sign-in.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
    ]
  },
  webpack: (config) => {
    // Windows drive-letter casing (E:\ vs e:\) makes webpack think Next's own
    // internal modules are duplicated. Harmless — silence the noise.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { message: /multiple modules with names that only differ in casing/ },
    ]
    // Silence webpack persistent-cache path-casing warnings (same root cause:
    // the .next cache was built under a different drive-letter casing).
    config.infrastructureLogging = { level: 'error' }
    return config
  },
}

// Sentry wrapper. Source-map upload is skipped automatically when no auth token
// is present, so this is safe in CI/local; runtime error capture is gated on the
// DSN env vars inside the sentry.*.config files.
export default withSentryConfig(nextConfig, {
  silent: true,
})
