import { tStripped } from '../localization/lib';
import { test_Alice_2W } from './setup/sessionTest';
import {
  hasElementPoppedUpThatShouldnt,
  waitForElement,
} from './utilities/utils';

test_Alice_2W(
  `Landing page states`,
  async ({ aliceWindow1, aliceWindow2 }, _testInfo) => {
    await Promise.all(
      [aliceWindow1, aliceWindow2].map((w) =>
        waitForElement({
          window: w,
          strategy: 'class',
          selector: 'session-conversation',
          maxWaitMs: 1000,
          shouldLog: true,
        }),
      ),
    );

    // Check that the account created has all the required strings displayed
    await Promise.all(
      [
        tStripped('onboardingAccountCreated'),
        tStripped('onboardingBubbleWelcomeToSession', {
          emoji: '👋',
        }),
        tStripped('conversationsNone'),
        tStripped('onboardingHitThePlusButton'),
      ].map(async (builder) =>
        waitForElement({
          window: aliceWindow1,
          strategy: 'data-testid',
          selector: 'empty-msg-view-account-created',
          maxWaitMs: 1_000,
          shouldLog: true,
          text: builder.toString(),
        }),
      ),
    );

    // Check that the account restored has all the required strings displayed
    await Promise.all(
      [
        tStripped('conversationsNone'),
        tStripped('onboardingHitThePlusButton'),
      ].map(async (builder) =>
        waitForElement({
          window: aliceWindow2,
          strategy: 'data-testid',
          selector: 'empty-msg-view-welcome',
          maxWaitMs: 1_000,
          shouldLog: true,
          text: builder.toString(),
        }),
      ),
    );

    // Make sure the "account created" part is not visible on the restored window
    await Promise.all(
      [
        tStripped('onboardingAccountCreated'),
        tStripped('onboardingBubbleWelcomeToSession', {
          emoji: '👋',
        }),
      ].map(async (builder) =>
        hasElementPoppedUpThatShouldnt(
          aliceWindow2,
          'data-testid',
          'empty-msg-view-account-created',

          builder.toString(),
        ),
      ),
    );
  },
);
