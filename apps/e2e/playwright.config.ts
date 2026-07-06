import { defineConfig, devices } from '@playwright/test';

const CLIENT_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4000';
const IS_CI = !!process.env.CI;

// Mobile-only specs live in tests/mobile-*; everything else is desktop.
const MOBILE_SPECS = /mobile-.*\.spec\.ts/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: CLIENT_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: MOBILE_SPECS,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: MOBILE_SPECS,
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
      url: `${API_URL}/api/v1/users`,
      reuseExistingServer: !IS_CI,
      timeout: 120_000,
    },
  ],
});
