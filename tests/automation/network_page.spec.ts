import { englishStrippedStr } from '../locale/localizedString';
import { sleepFor } from '../promise_utils';
import { recoverFromSeed } from './setup/recovery_using_seed';
import { sessionTestOneWindow, test_Alice_1W } from './setup/sessionTest';
import { User } from './types/testing';
import {
  checkModalStrings,
  clickOnTestIdWithText,
  doesElementExist,
  grabTextFromElement,
  typeIntoInput,
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

sessionTestOneWindow('No token bonus', async ([window]) => {
  const userA: User = {
    userName: 'Alice',
    accountid:
      '666016369d70fa182d981e257d49fbdad6b71070a31114c8db8f13f4e110db7c',
    recoveryPassword:
      'initiate doorway obliged pancakes huddle omega vexed regular antics impel sonic gorilla initiate',
  };
  await recoverFromSeed(window, userA.recoveryPassword, true);
  await clickOnTestIdWithText(window, 'settings-section');
  await clickOnTestIdWithText(window, 'session-network-settings-menu-item');
  await waitForLoadingAnimationToFinish(window, 'loading-spinner');
  //   Need to wait for page to load
  await sleepFor(1000);
  await doesElementExist(window, 'data-testid', 'token-bonus-amount');
});

sessionTestOneWindow('Token bonus matches', async ([window]) => {
  const userA: User = {
    userName: 'Alice',
    accountid:
      'cafe7498de7c43aa528551392a9b573ac4154ec9db455652d01cddd48e345a22',
    recoveryPassword:
      'pirate pancakes lunar jabbed serving cake greater textbook icon items roles ouch pirate',
  };
  const expectedTokenAmount = '125';
  await recoverFromSeed(window, userA.recoveryPassword, true);
  await clickOnTestIdWithText(window, 'settings-section');
  await clickOnTestIdWithText(window, 'session-network-settings-menu-item');
  await waitForLoadingAnimationToFinish(window, 'loading-spinner');
  const actualTokenAmount = await grabTextFromElement(
    window,
    'data-testid',
    'token-bonus-amount',
  );
  if (actualTokenAmount !== expectedTokenAmount) {
    throw new Error(
      `Expected token amount: ${expectedTokenAmount}, but got: ${actualTokenAmount}`,
    );
  }
});

sessionTestOneWindow('Invalid checksum', async ([window]) => {
  const userA: User = {
    userName: 'Alice',
    accountid:
      'cafe7498de7c43aa528551392a9b573ac4154ec9db455652d01cddd48e345a22',
    recoveryPassword:
      'pirate pancakes lunar jabbed serving cake greater textbook icon items roles ouch pirate',
  };
  const invalidAddress = '0x8282A0293DB7487C09Ca145Ace9bb23c345EaeD6';
  // TODO Add string in once crowdin has been updated
  // const expectedError = englishStrippedStr('sessionNetworkWalletAddressError').toString();
  const expectedError =
    'You have submitted an invalid Ethereum wallet address. Please check and try again.';
  await recoverFromSeed(window, userA.recoveryPassword, true);
  await clickOnTestIdWithText(window, 'settings-section');
  await clickOnTestIdWithText(window, 'session-network-settings-menu-item');
  await waitForLoadingAnimationToFinish(window, 'loading-spinner');
  await clickOnTestIdWithText(window, 'token-claim-button');
  await typeIntoInput(window, 'wallet-address-input', invalidAddress);
  await clickOnTestIdWithText(window, 'submit-button');
  await waitForTestIdWithText(window, 'session-error-message');
  const returnedError = await grabTextFromElement(
    window,
    'data-testid',
    'session-error-message',
  );
  if (returnedError !== expectedError) {
    throw new Error(
      `Expected error message: ${expectedError}, but got: ${returnedError}`,
    );
  }
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
