import type { MetadataRoute } from 'next';
import { formations } from '@/lib/formations';

const BASE = 'https://ckim-formation.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1.0 },
    { url: `${BASE}/organisme`, lastModified: now, priority: 0.8 },
    { url: `${BASE}/formations`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.7 },
    ...formations.map((f) => ({
      url: `${BASE}/formations/${f.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
  ];
}
