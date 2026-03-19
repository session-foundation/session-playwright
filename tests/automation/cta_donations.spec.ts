import { Page } from '@playwright/test';

import { tStripped } from '../localization/lib';
import { test_Alice_1W } from './setup/sessionTest';
import { mockDBCreationTime } from './utilities/time_travel';
import {
  checkCTAStrings,
  reloadWindow,
  verifyNoCTAShows,
} from './utilities/utils';

async function verifyDonateCTAShows(window: Page) {
  await checkCTAStrings(
    window,
    tStripped('donateSessionAppealTitle'),
    tStripped('donateSessionAppealDescription'),
    [tStripped('donateSessionAppealReadMore')],
  );
}

test_Alice_1W(
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

test_Alice_1W(
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
