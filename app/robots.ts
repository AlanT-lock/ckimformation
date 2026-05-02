import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/(auth)', '/(client)', '/(admin)', '/(formateur)'] },
    sitemap: 'https://ckim-formation.fr/sitemap.xml',
  };
}
