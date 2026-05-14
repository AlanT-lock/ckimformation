import type { MetadataRoute } from 'next';
import { getAllFormations } from '@/lib/db/formations';

const BASE = 'https://ckimformation.fr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const formations = await getAllFormations();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/formations`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/organisme`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/financement`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${BASE}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...formations.map((f) => ({
      url: `${BASE}/formations/${f.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
