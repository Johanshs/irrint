import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '.local/playwright-artifacts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 7000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: '.local/playwright-report', open: 'never' }],
    ['json', { outputFile: '.local/playwright-results.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run demo:start',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
