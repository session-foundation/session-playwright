import { test_Alice_2W } from './setup/sessionTest';
import { compareScreenshot, waitForElement } from './utilities/utils';

// TODO: Normalize screenshot dimensions before comparison to handle different pixel densities (e.g. with sharp)
// This would fix MacBook Retina (2x) vs M4 Mac Mini (1x) pixel density differences (1000x1584 vs 500x792)
// Alternatives:
// - Try to set deviceScaleFactor: 1 in Playwright context to force consistent scaling
// - Record pixel density dependent screenshots

test_Alice_2W(
  `Landing page states`,
  async ({ aliceWindow1, aliceWindow2 }, testInfo) => {
    const os = process.platform;
    console.log('OS:', os);
    const [landingPage, restoredPage] = await Promise.all([
      waitForElement(aliceWindow1, 'class', 'session-conversation'),
      waitForElement(aliceWindow2, 'class', 'session-conversation'),
    ]);

    await compareScreenshot(
      landingPage,
      `${testInfo.title}`,
      'new-account',
      os,
    );
    await compareScreenshot(
      restoredPage,
      `${testInfo.title}`,
      'restored-account',
      os,
    );
  },
);
