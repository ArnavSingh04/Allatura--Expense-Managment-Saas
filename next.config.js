/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  // The parent allatura-fe folder also has a lockfile, so Next otherwise
  // treats that directory as the app root and emits a dev warning.
  outputFileTracingRoot: path.join(__dirname),
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
