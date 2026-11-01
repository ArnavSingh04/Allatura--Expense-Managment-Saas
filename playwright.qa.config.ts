import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.mocked-browser.spec.ts',
  fullyParallel: false, workers: 1, retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 45000,
  expect: { timeout: 10000 },
  outputDir: process.env.PLUTUS_QA_BROWSER_OUTPUT,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLUTUS_QA_BROWSER_JSON }],
    ['html', { outputFolder: process.env.PLUTUS_QA_BROWSER_HTML, open: 'never' }],
  ],
  use: {
    baseURL: process.env.PLUTUS_QA_BASE_URL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    headless: true,
    proxy: { server: process.env.PLUTUS_QA_BROWSER_PROXY || 'http://127.0.0.1:1', bypass: '' },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-background-networking', '--disable-quic', '--proxy-bypass-list=<-loopback>', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'] } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], launchOptions: { firefoxUserPrefs: { 'network.dns.disablePrefetch': true, 'network.prefetch-next': false, 'network.proxy.no_proxies_on': '', 'network.captive-portal-service.enabled': false, 'network.connectivity-service.enabled': false } } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
