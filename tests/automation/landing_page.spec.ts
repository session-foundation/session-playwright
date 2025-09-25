import { englishStrippedStr } from '../localization/englishStrippedStr';
import { test_Alice_2W } from './setup/sessionTest';
import {
  hasElementPoppedUpThatShouldnt,
  waitForElement,
} from './utilities/utils';

// TODO: Normalize screenshot dimensions before comparison to handle different pixel densities (e.g. with sharp)
// This would fix MacBook Retina (2x) vs M4 Mac Mini (1x) pixel density differences (1000x1584 vs 500x792)
// Alternatives:
// - Try to set deviceScaleFactor: 1 in Playwright context to force consistent scaling
// - Record pixel density dependent screenshots

test_Alice_2W(
  `Landing page states`,
  async ({ aliceWindow1, aliceWindow2 }, _testInfo) => {
    const os = process.platform;
    console.log('OS:', os);
    await Promise.all([
      waitForElement(aliceWindow1, 'class', 'session-conversation'),
      waitForElement(aliceWindow2, 'class', 'session-conversation'),
    ]);

    // Check that the account created has all the required strings displayed
    await Promise.all(
      [
        englishStrippedStr('onboardingAccountCreated'),
        englishStrippedStr('onboardingBubbleWelcomeToSession').withArgs({
          emoji: '👋',
        }),
        englishStrippedStr('conversationsNone'),
        englishStrippedStr('onboardingHitThePlusButton'),
      ].map(async (builder) =>
        waitForElement(
          aliceWindow1,
          'data-testid',
          'empty-msg-view-account-created',
          1000,
          builder.toString(),
        ),
      ),
    );

    // Check that the account restored has all the required strings displayed
    await Promise.all(
      [
        englishStrippedStr('conversationsNone'),
        englishStrippedStr('onboardingHitThePlusButton'),
      ].map(async (builder) =>
        waitForElement(
          aliceWindow2,
          'data-testid',
          'empty-msg-view-welcome',
          1000,
          builder.toString(),
        ),
      ),
    );

    // Make sure the "account created" part is not visible on the restored window
    await Promise.all(
      [
        englishStrippedStr('onboardingAccountCreated'),
        englishStrippedStr('onboardingBubbleWelcomeToSession').withArgs({
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
