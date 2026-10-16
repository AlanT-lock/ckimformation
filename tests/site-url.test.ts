import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteUrl } from '@/lib/site-url';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteUrl', () => {
  it('utilise NEXT_PUBLIC_SITE_URL (sans slash final)', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ckimformation.fr/');
    expect(siteUrl()).toBe('https://ckimformation.fr');
  });

  it('ignore une adresse *.vercel.app en production', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ckim-formation.vercel.app');
    vi.stubEnv('NODE_ENV', 'production');
    expect(siteUrl()).toBe('https://ckimformation.fr');
  });

  it('domaine officiel par défaut en production', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(siteUrl()).toBe('https://ckimformation.fr');
  });

  it('localhost par défaut en développement', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    expect(siteUrl()).toBe('http://localhost:3000');
  });
});
