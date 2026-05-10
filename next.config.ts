import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    // Force le workspace root sur ce projet, sinon Next remonte vers ~/pnpm-lock.yaml
    // par erreur. import.meta.dirname est sûr (build-time uniquement).
    root: import.meta.dirname,
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
