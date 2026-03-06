import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { toNumber } from 'lodash';

import { screenshotFolder } from './tests/automation/constants/variables';

dotenv.config({ quiet: true });

function repeatEach() {
  return process.env.PLAYWRIGHT_REPEAT_COUNT
    ? toNumber(process.env.PLAYWRIGHT_REPEAT_COUNT)
    : 0;
}

function retryEach() {
  return process.env.PLAYWRIGHT_RETRIES_COUNT
    ? toNumber(process.env.PLAYWRIGHT_RETRIES_COUNT)
    : 0;
}

function workersCount() {
  return process.env.PLAYWRIGHT_WORKERS_COUNT
    ? toNumber(process.env.PLAYWRIGHT_WORKERS_COUNT)
    : 1;
}

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
  retries: retryEach(),
  repeatEach: repeatEach(),
  reportSlowTests: null,
  globalSetup: './global.setup', // clean leftovers of previous test runs on start, runs only once
  snapshotPathTemplate: `${screenshotFolder}/{testName}/{arg}-{platform}{ext}`,
  projects: [
    /**
     * The community tests relying on sending/receiving messages are unreliable when run in parallel.
     * I think it comes down to the jump that happens when a new message is received, and also
     * because receiving a new message closes an open context menu.
     */
    {
      name: 'Community tests',
      // Those needs to be run sequentially as they are making each others unreliable
      // (they all are using the same community)
      testMatch: '**/*community*tests.spec.ts',
      fullyParallel: false,
      workers: 1, // those community tests need to be run sequentially
    },
    {
      name: 'All other tests',
      testMatch: '**/!(*community*tests).spec.ts',
      fullyParallel: true, // set this to true so that tests in the same file are not run in parallel
      workers: workersCount(),
    },
  ],
});
