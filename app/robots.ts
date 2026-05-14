import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/formateur/',
        '/stagiaire/',
        '/login',
        '/logout',
        '/callback',
        '/setup-password',
        '/signup-entreprise',
        '/signup-particulier',
        '/enquete/',
        '/enquete-financeur/',
        '/actions/',
      ],
    },
    sitemap: 'https://ckimformation.fr/sitemap.xml',
  };
}
