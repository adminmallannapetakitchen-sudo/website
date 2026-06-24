import type { MetadataRoute } from 'next'

const BASE = 'https://www.mallannapetakitchen.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/menu`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/sunday-special`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/register`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
