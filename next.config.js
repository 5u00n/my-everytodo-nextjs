/** @type {import('next').NextConfig} */
const nextConfig = {
  // Modern Next.js 16 configuration for Vercel
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Turbopack configuration for Next.js 16
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // PWA configuration using modern approach
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
