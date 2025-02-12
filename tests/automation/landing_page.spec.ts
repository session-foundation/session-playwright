import { test_Alice_2W } from './setup/sessionTest';
import { compareScreenshot, waitForElement } from './utilities/utils';

export type ElementState = 'new-account' | 'restored-account';

test_Alice_2W(
  `Landing page states`,
  async ({ aliceWindow1, aliceWindow2 }, testInfo) => {
    const [landingPage, restoredPage] = await Promise.all([
      waitForElement(aliceWindow1, 'class', 'session-conversation'),
      waitForElement(aliceWindow2, 'class', 'session-conversation'),
    ]);
    const [result1, result2] = await Promise.allSettled([
      compareScreenshot(landingPage, `${testInfo.title}`, 'new-account'),
      compareScreenshot(restoredPage, `${testInfo.title}`, 'restored-account'),
    ]);
    if (result1.status === 'rejected' || result2.status === 'rejected') {
      throw new Error('One or both screenshot comparisons failed');
    } else {
      console.log('Screenshots compared successfully');
    }
  },
);
