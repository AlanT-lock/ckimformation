import type { MetadataRoute } from 'next';
import { getAllFormations } from '@/lib/db/formations';

const BASE = 'https://ckimformation.fr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const formations = await getAllFormations();
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
