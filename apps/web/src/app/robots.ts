import type { MetadataRoute } from 'next'

const BASE = 'https://www.mallannapetakitchen.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private/transactional areas out of the index.
        disallow: ['/admin', '/account', '/checkout', '/cart'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
