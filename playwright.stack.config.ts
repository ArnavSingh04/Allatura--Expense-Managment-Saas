import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser', testMatch: '**/*.real-stack.spec.ts',
  forbidOnly: true, fullyParallel: false, workers: 1, retries: 0,
  timeout: 60000, expect: { timeout: 15000 },
  outputDir: process.env.PLUTUS_QA_BROWSER_OUTPUT,
  reporter: [['list'], ['json', { outputFile: process.env.PLUTUS_QA_BROWSER_JSON }]],
  use: { baseURL: process.env.PLUTUS_QA_BASE_URL, serviceWorkers: 'block', headless: true,
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    proxy: { server: process.env.PLUTUS_QA_BROWSER_PROXY || 'http://127.0.0.1:1', bypass: '' } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: {
    args: ['--disable-background-networking', '--disable-quic', '--proxy-bypass-list=<-loopback>', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
  } } }],
});
