import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Replace with the real production domain once known
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pingaphotography.com'

  return [
    { url: base,              lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/exhibits`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/shop`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/enquiry`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.6 },
  ]
}
