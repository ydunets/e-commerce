import { defineConfig, devices } from '@playwright/test';
import {
  API_ORIGIN,
  type TestOptions,
  type WorkerOptions,
} from './tests/fixtures';

const CLIENT_URL = 'http://localhost:5173';
const PROD_CLIENT_URL = 'http://localhost:4173';
const IS_CI = !!process.env.CI;

const MOBILE_SPECS = /mobile-.*\.spec\.ts/;
const STREAMING_SPECS = /streaming\.spec\.ts/;

// Above the storefront's own request latency, below the point where a genuinely
// stuck assertion stops looking stuck.
const ASSERTION_TIMEOUT_MS = 7_000;

const SUMMARY_REPORTER = './reporters/summary-reporter.ts';

export default defineConfig<TestOptions, WorkerOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  // A test that only passes on retry hides a race; on CI that is a failure.
  failOnFlakyTests: IS_CI,
  expect: { timeout: ASSERTION_TIMEOUT_MS },
  reporter: IS_CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        [SUMMARY_REPORTER],
      ]
    : [['list'], [SUMMARY_REPORTER]],
  use: {
    baseURL: CLIENT_URL,
    apiBaseURL: API_ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [MOBILE_SPECS, STREAMING_SPECS],
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: MOBILE_SPECS,
    },
    {
      name: 'streaming-prod',
      use: { ...devices['Desktop Chrome'], baseURL: PROD_CLIENT_URL },
      testMatch: STREAMING_SPECS,
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @e-commerce/client dev',
      url: CLIENT_URL,
      reuseExistingServer: !IS_CI,
      timeout: 120_000,
    },
    {
      // Brings up Postgres first, then the API (see scripts/start-api.mjs).
      command: 'node scripts/start-api.mjs',
      url: `${API_ORIGIN}/health`,
      reuseExistingServer: !IS_CI,
      timeout: 120_000,
    },
    {
      command:
        'pnpm --filter @e-commerce/client build && node scripts/start-prod-client.mjs',
      url: PROD_CLIENT_URL,
      env: { PORT: '4173' },
      reuseExistingServer: !IS_CI,
      timeout: 240_000,
    },
  ],
});
