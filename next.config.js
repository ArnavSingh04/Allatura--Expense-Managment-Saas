/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
