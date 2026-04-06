/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // Target for proxy only — use absolute URL (not NEXT_PUBLIC=/api/v1).
    const backend =
      process.env.BACKEND_API_URL ||
      process.env.INTERNAL_BACKEND_URL ||
      'http://localhost:3001/v1';
    const dest = String(backend).replace(/\/$/, '');
    if (!dest.startsWith('http')) {
      return [];
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: `${dest}/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });

    return config;
  },
}

module.exports = nextConfig
