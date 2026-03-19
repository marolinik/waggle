/**
 * 9G-4: Playwright Visual Regression Configuration
 *
 * Screenshot baselines for all 7 views in dark + light mode = 14 baselines.
 * Pixel diff threshold: 0.3% (allows minor anti-aliasing differences).
 *
 * Usage:
 *   npx playwright test                    # Run all visual tests
 *   npx playwright test --update-snapshots # Update baselines
 *
 * Prerequisites:
 *   Server must be running: cd packages/server && npx tsx src/local/start.ts
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/baselines',
  snapshotPathTemplate: '{snapshotDir}/{testName}/{arg}{ext}',
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.003, // 0.3% threshold
      animations: 'disabled',
    },
  },
  fullyParallel: false, // Sequential to avoid port conflicts
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3333',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    viewport: { width: 1200, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
