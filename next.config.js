/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Baseline security headers. Content-Security-Policy is deliberately NOT set
  // here: the inline theme-sync script in src/app/layout.tsx would need a nonce
  // or hash, so CSP should be introduced separately and in report-only mode
  // first.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  // NOTE: /api/v1/* is handled by the auth-injecting route handler at
  // src/app/api/v1/[...path]/route.ts (it forwards the Auth0 access token to
  // the Nest backend), so there is no next.config rewrite for it anymore.
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
