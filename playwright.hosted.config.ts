import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e-hosted',
  outputDir: '.local/playwright-hosted-artifacts',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: [['list'], ['html', { outputFolder: '.local/playwright-hosted-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: [
    {
      command: 'npm run start:hosted',
      url: 'http://127.0.0.1:8791/healthz',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        IRRINT_ALLOWED_ORIGINS: 'http://127.0.0.1:5173',
        IRRINT_DATA_DIR: '.local/hosted-e2e',
        IRRINT_DEVICE_TOKEN: 'hosted-e2e-device-token',
        IRRINT_SESSION_SECRET: 'hosted-e2e-session-secret-with-at-least-32-bytes',
        PORT: '8791',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 30_000,
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:8791' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
