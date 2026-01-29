import type { Page } from '@playwright/test';

import { sleepFor } from '../promise_utils';
import { Global, HomeScreen, Settings } from './locators';
import { test_Alice1 } from './setup/sessionTest';
import {
  joinDefaultCommunity,
  leaveCommunity,
} from './utilities/join_community';
import { linkedDevice } from './utilities/linked_device';
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
  console.log('On home screen, banner is visible');
}

test_Alice1(
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

test_Alice1(
  'Recovery password banner 2 windows',
  async ({ aliceWindow1, alice }) => {
    await joinDefaultCommunity(aliceWindow1, 'Lokinet Updates');
    await joinDefaultCommunity(aliceWindow1, 'Session Network Updates');
    await joinDefaultCommunity(aliceWindow1, 'Session Updates');
    const aliceWindow2 = await linkedDevice(alice.recoveryPassword);
    await sleepFor(2_000);
    await bannerShouldNotAppear(aliceWindow2);
  },
);

test_Alice1(
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

test_Alice1(
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
