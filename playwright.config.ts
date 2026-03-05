import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { toNumber } from 'lodash';

import { screenshotFolder } from './tests/automation/constants/variables';

dotenv.config({ quiet: true });

export default defineConfig({
  timeout: 350000,
  globalTimeout: 6000000,
  reporter: [
    [
      process.stdout.isTTY && process.env.NO_TUI !== '1'
        ? './tuiReporter.ts'
        : './sessionReporter.ts',
    ],
    // ['allure-playwright'], // enabling starts generating reports to the allure-results folder
  ],
  testDir: './tests/automation',
  testIgnore: '*.js',
  outputDir: './tests/automation/test-results',
  retries: process.env.PLAYWRIGHT_RETRIES_COUNT
    ? toNumber(process.env.PLAYWRIGHT_RETRIES_COUNT)
    : 0,
  repeatEach: process.env.PLAYWRIGHT_REPEAT_COUNT
    ? toNumber(process.env.PLAYWRIGHT_REPEAT_COUNT)
    : 0,
  reportSlowTests: null,
  globalSetup: './global.setup', // clean leftovers of previous test runs on start, runs only once
  snapshotPathTemplate: `${screenshotFolder}/{testName}/{arg}-{platform}{ext}`,
  projects: [
    {
      name: 'Community tests',
      // Those needs to be run sequentially as they are making each others unreliable
      // (they all are using the same community)
      testMatch: '**/*community*tests.spec.ts',
      fullyParallel: false,
      workers: 1,
      repeatEach: 3,
    },
    {
      name: 'All other tests',
      testMatch: '**/!(*community*tests).spec.ts',
      fullyParallel: true, // otherwise, tests in the same file are not run in parallel
      workers: toNumber(process.env.PLAYWRIGHT_WORKERS_COUNT) || 1,
    },
  ],
});
