import { defineConfig, devices } from '@playwright/test';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
mkdirSync(resolve(__dirname, 'artifacts'), { recursive: true });

export default defineConfig({
  testDir: __dirname,
  testMatch: 'smoke.spec.ts',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: resolve(__dirname, 'artifacts/last-run.json') }],
    ['html', { outputFolder: resolve(__dirname, 'artifacts/html-report'), open: 'never' }],
  ],
  use: {
    baseURL: 'https://theerainers.com',
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 393, height: 851 } },
    },
  ],
  globalSetup: resolve(__dirname, 'global-setup.ts'),
  globalTeardown: resolve(__dirname, 'global-teardown.ts'),
});
