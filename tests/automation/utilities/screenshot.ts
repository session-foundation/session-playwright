import type { ElementHandle, Locator } from '@playwright/test';

import { expect } from '@playwright/test';

import { sleepFor } from '../../promise_utils';

export type ScreenshotComparisonOptions = {
  element: ElementHandle | Locator;
  snapshotName: string;
  maxRetryDurationMs?: number;
  imageType?: 'jpeg' | 'png';
  maxDiffPixelRatio?: number;
};

/**
 * Takes a screenshot of an element and compares it against a baseline snapshot.
 * Retries until the screenshot matches or timeout is reached.
 *
 * @param options - Screenshot comparison configuration
 * @throws Error if screenshot doesn't match within the retry duration
 */
export async function compareElementScreenshot(
  options: ScreenshotComparisonOptions,
): Promise<void> {
  const {
    element,
    snapshotName,
    maxRetryDurationMs = 20000,
    imageType = 'jpeg',
    maxDiffPixelRatio = 0.02,
  } = options;

  const start = Date.now();
  const pollIntervalMs = 500;
  let tryNumber = 0;
  let lastError: Error | undefined;

  while (Date.now() - start <= maxRetryDurationMs) {
    try {
      const screenshot = await element.screenshot({
        type: imageType,
      });

      expect(screenshot).toMatchSnapshot({
        name: snapshotName,
        maxDiffPixelRatio,
      });

      console.info(
        `Screenshot matching of "${snapshotName}" passed after ${tryNumber} ${
          tryNumber === 1 ? 'retry' : 'retries'
        }`,
      );
      return; // Exit immediately on success
    } catch (e) {
      lastError = e as Error;
      tryNumber++;

      // Wait between attempts if we haven't exceeded timeout
      if (Date.now() - start + pollIntervalMs <= maxRetryDurationMs) {
        await sleepFor(pollIntervalMs);
      }
    }
  }

  // Only reach here if we timed out
  console.error(
    `Screenshot matching of "${snapshotName}" failed after ${tryNumber} attempt(s) (${maxRetryDurationMs}ms)`,
  );
  throw (
    lastError ?? new Error('Screenshot comparison failed without error details')
  );
}
