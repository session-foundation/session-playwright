import { englishStrippedStr } from '../locale/localizedString';
import { test_Alice_1W } from './setup/sessionTest';
import {
  checkModalStrings,
  clickOnTestIdWithText,
  grabTextFromElement,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
} from './utilities/utils';

/* Waiting for test id to be fixed 
// Links to test are:
- Learn more Network link
- Learn more staking link
- How to create wallet link
*/

test_Alice_1W('Learn more network link', async ({ aliceWindow1 }) => {
  await clickOnTestIdWithText(aliceWindow1, 'settings-section');
  await clickOnTestIdWithText(
    aliceWindow1,
    'session-network-settings-menu-item',
  );
  await waitForLoadingAnimationToFinish(aliceWindow1, 'loading-spinner');
  await clickOnTestIdWithText(aliceWindow1, 'learn-more-network-link');
  await checkModalStrings(
    aliceWindow1,
    englishStrippedStr('urlOpen').toString(),
    englishStrippedStr('urlOpenDescription').toString(),
  );
  const el = await waitForElement(
    aliceWindow1,
    'data-testid',
    'open-url-confirm-button',
  );
  const href = await el.getAttribute('href');
  console.log('href', href);
});

test_Alice_1W('Refreshing page works', async ({ aliceWindow1 }) => {
  // TODO Add string in once crowdin has been updated
  // const expectedText = englishStrippedStr('updated')
  //   .withArgs({ relative_time: '0m' })
  //   .toString();
  const expectedText = 'Last updated 0m ago';
  await clickOnTestIdWithText(aliceWindow1, 'settings-section');
  await clickOnTestIdWithText(
    aliceWindow1,
    'session-network-settings-menu-item',
  );
  await waitForLoadingAnimationToFinish(aliceWindow1, 'loading-spinner');
  await clickOnTestIdWithText(aliceWindow1, 'refresh-button');
  await waitForLoadingAnimationToFinish(aliceWindow1, 'loading-spinner');
  await waitForTestIdWithText(aliceWindow1, 'last-updated-timestamp');
  const returnedText = await grabTextFromElement(
    aliceWindow1,
    'data-testid',
    'last-updated-timestamp',
  );
  if (returnedText !== expectedText) {
    throw new Error(`Expected text: ${expectedText}, but got: ${returnedText}`);
  }
});
