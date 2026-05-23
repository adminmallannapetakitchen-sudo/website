/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
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

export default nextConfig
