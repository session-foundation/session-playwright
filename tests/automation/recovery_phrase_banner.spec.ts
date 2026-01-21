import type { Page } from '@playwright/test';

import { Global, HomeScreen, Settings } from './locators';
import { test_Alice_1W } from './setup/sessionTest';
import {
  joinDefaultCommunity,
  leaveCommunity,
} from './utilities/join_community';
import {
  clickOn,
  hasElementPoppedUpThatShouldnt,
  waitForTestIdWithText,
} from './utilities/utils';

async function bannerShouldNotAppear(window: Page) {
  await waitForTestIdWithText(window, HomeScreen.plusButton.selector);
  await hasElementPoppedUpThatShouldnt(
    window,
    HomeScreen.revealRecoveryPhraseButton.strategy,
    HomeScreen.revealRecoveryPhraseButton.selector,
  );
  console.log('On home screen, banner did not appear');
}

async function bannerShouldAppear(window: Page) {
  await waitForTestIdWithText(window, HomeScreen.plusButton.selector);
  await waitForTestIdWithText(
    window,
    HomeScreen.revealRecoveryPhraseButton.selector,
  );
  console.log('Banner is visible');
}

test_Alice_1W(
  'Recovery password banner appears after >2 conversations',
  async ({ aliceWindow1 }) => {
    await bannerShouldNotAppear(aliceWindow1);
    await joinDefaultCommunity(aliceWindow1, 'Lokinet Updates');
    await bannerShouldNotAppear(aliceWindow1);
    await joinDefaultCommunity(aliceWindow1, 'Session Network Updates');
    await bannerShouldNotAppear(aliceWindow1);
    await joinDefaultCommunity(aliceWindow1, 'Session Updates');
    await bannerShouldAppear(aliceWindow1);
  },
);

test_Alice_1W(
  'Recovery password banner persists when conversation count drops below 3',
  async ({ aliceWindow1 }) => {
    await joinDefaultCommunity(aliceWindow1, 'Lokinet Updates');
    await joinDefaultCommunity(aliceWindow1, 'Session Network Updates');
    await joinDefaultCommunity(aliceWindow1, 'Session Updates');
    await bannerShouldAppear(aliceWindow1);

    await leaveCommunity(aliceWindow1, 'Lokinet Updates');
    await bannerShouldAppear(aliceWindow1);
  },
);

test_Alice_1W(
  'Recovery password banner disappears after being opened',
  async ({ aliceWindow1 }) => {
    await joinDefaultCommunity(aliceWindow1, 'Lokinet Updates');
    await joinDefaultCommunity(aliceWindow1, 'Session Network Updates');
    await joinDefaultCommunity(aliceWindow1, 'Session Updates');
    await bannerShouldAppear(aliceWindow1);
    await clickOn(aliceWindow1, HomeScreen.revealRecoveryPhraseButton);
    await waitForTestIdWithText(
      aliceWindow1,
      Settings.recoveryPasswordContainer.selector,
    );
    await clickOn(aliceWindow1, Global.modalCloseButton);
    await bannerShouldNotAppear(aliceWindow1);
  },
);
