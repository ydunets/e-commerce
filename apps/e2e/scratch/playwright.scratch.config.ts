import { defineConfig, devices } from '@playwright/test';

/**
 * Deliberately separate from the suite's own config: these exercises are run
 * by hand, never by `pnpm e2e`, and they bring up no servers of their own.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.scratch\.ts/,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
  },
});
