import { englishStrippedStr } from '../localization/englishStrippedStr';
import { CTA } from './locators';
import { test_Alice_1W_no_network } from './setup/sessionTest';
import { mockDBCreationTime } from './utilities/time_travel';
import {
  checkCTAStrings,
  hasElementPoppedUpThatShouldnt,
} from './utilities/utils';

test_Alice_1W_no_network(
  'Donate CTA, DB age >= 7 days',
  async ({ aliceWindow1 }) => {
    await checkCTAStrings(
      aliceWindow1,
      englishStrippedStr('donateSessionHelp').toString(),
      englishStrippedStr('donateSessionDescription').toString(),
      [
        englishStrippedStr('donate').toString(),
        englishStrippedStr('maybeLater').toString(),
      ],
    );
  },
  {
    dbCreationTimestampMs: mockDBCreationTime({
      days: -7,
      minutes: -2,
    }),
  },
);

test_Alice_1W_no_network(
  'Donate CTA, DB age < 7 days',
  async ({ aliceWindow1 }) => {
    await Promise.all([
      hasElementPoppedUpThatShouldnt(
        aliceWindow1,
        CTA.heading.strategy,
        CTA.heading.selector,
      ),
      hasElementPoppedUpThatShouldnt(
        aliceWindow1,
        CTA.description.strategy,
        CTA.description.selector,
      ),
      hasElementPoppedUpThatShouldnt(
        aliceWindow1,
        CTA.confirmButton.strategy,
        CTA.confirmButton.selector,
      ),
      hasElementPoppedUpThatShouldnt(
        aliceWindow1,
        CTA.cancelButton.strategy,
        CTA.cancelButton.selector,
      ),
    ]);
  },
  {
    dbCreationTimestampMs: mockDBCreationTime({
      days: -6,
      hours: -23,
      minutes: -58,
    }),
  },
);
