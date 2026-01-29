import { Page } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import { CTA, Global } from './locators';
import { test_Alice1 } from './setup/sessionTest';
import { mockDBCreationTime } from './utilities/time_travel';
import {
  checkCTAStrings,
  checkModalStrings,
  clickOn,
  reloadWindow,
  verifyNoCTAShows,
} from './utilities/utils';

async function verifyDonateCTAShows(window: Page) {
  await checkCTAStrings(
    window,
    englishStrippedStr('donateSessionHelp').toString(),
    englishStrippedStr('donateSessionDescription').toString(),
    [
      englishStrippedStr('donate').toString(),
      englishStrippedStr('maybeLater').toString(),
    ],
  );
}

test_Alice1(
  'Donate CTA, DB age >= 7 days, max 4 times',
  async ({ aliceWindow1 }) => {
    const MAX_DONATE_CTA_SHOWS = 4;

    // Check CTA appears for the first MAX_DONATE_CTA_SHOWS times
    for (let i = 0; i < MAX_DONATE_CTA_SHOWS; i++) {
      await verifyDonateCTAShows(aliceWindow1);
      await reloadWindow(aliceWindow1);
    }

    // Verify CTA doesn't appear after MAX_DONATE_CTA_SHOWS reloads
    await verifyNoCTAShows(aliceWindow1);
  },
  {
    dbCreationTimestampMs: mockDBCreationTime({
      days: -7,
      minutes: -2,
    }),
  },
);

const urlModalButtons = [
  { button: Global.openUrlButton, name: 'Open' },
  { button: Global.copyUrlButton, name: 'Copy' },
];

urlModalButtons.forEach(({ button, name }) => {
  test_Alice1(
    `Donate CTA, never shows after clicking ${name} in URL modal`,
    async ({ aliceWindow1 }) => {
      const url = 'https://getsession.org/donate';

      // First time: CTA should appear
      await verifyDonateCTAShows(aliceWindow1);

      await clickOn(aliceWindow1, CTA.confirmButton);
      await checkModalStrings(
        aliceWindow1,
        englishStrippedStr('urlOpen').toString(),
        englishStrippedStr('urlOpenDescription').withArgs({ url }).toString(),
        'openUrlModal',
      );

      // Click the Open or Copy button
      // Note: "Open" spawns a system browser outside Playwright's control
      await clickOn(aliceWindow1, button);

      // Reload and verify CTA never appears again
      await reloadWindow(aliceWindow1);
      await verifyNoCTAShows(aliceWindow1);
    },
    {
      dbCreationTimestampMs: mockDBCreationTime({
        days: -7,
        minutes: -2,
      }),
    },
  );
});

test_Alice1(
  'Donate CTA, DB age < 7 days',
  async ({ aliceWindow1 }) => {
    await verifyNoCTAShows(aliceWindow1);
  },
  {
    dbCreationTimestampMs: mockDBCreationTime({
      days: -6,
      hours: -23,
      minutes: -58,
    }),
  },
);
