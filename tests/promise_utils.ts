import { Page } from '@playwright/test';

export const sleepFor = async (ms: number, showLog = false) => {
  if (showLog) {
    // eslint-disable-next-line no-console
    console.info(`sleeping for ${ms}ms...`);
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export async function doForAll<T>(
  fn: (window: Page) => Promise<T>,
  windows: Array<Page>,
) {
  return Promise.all(
    windows.map(async (w) => {
      return fn(w);
    }),
  );
}
