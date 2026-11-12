import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['next-auth'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
