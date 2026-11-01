import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const source = (name: string) => path.join(root, 'src', name);

export default defineConfig({
  cacheDir: path.join(root, '.qa-cache/vite'),
  server: { host: '127.0.0.1', port: 0, hmr: false },
  resolve: { preserveSymlinks: true, alias: {
    '@/components': source('app/components'), '@/contexts': source('app/contexts'),
    '@/services': source('services'), '@/types': source('types'), '@/lib': source('lib'),
    '@/utils': source('utils'), '@/data': source('data'), '@/styles': source('styles'), '@/theme': source('theme'),
  } },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./qa/harness/component-setup.ts'],
    include: ['tests/components/**/*.test.tsx', 'tests/unit/**/*.test.ts', 'qa/harness/**/*.test.ts'],
    pool: 'threads', maxWorkers: 1, minWorkers: 1, fileParallelism: false,
    testTimeout: 10000,
    coverage: {
      provider: 'v8', include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/app/api/**', 'src/proxy.ts', 'src/lib/auth0.ts'],
      reportsDirectory: process.env.PLUTUS_QA_COVERAGE_DIR,
      reporter: ['text-summary', 'json-summary', 'lcov', 'html'],
    },
  },
});
