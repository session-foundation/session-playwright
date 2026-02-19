import { type Page, test } from '@playwright/test';

import { tStripped } from '../../localization/lib';
import {
  type DefaultCommunity,
  testCommunityLink,
  testCommunityName,
} from '../constants/community';
import { Global, HomeScreen } from '../locators';
import {
  clickOn,
  clickOnMatchingText,
  clickOnWithText,
  hasElementBeenDeleted,
  pasteIntoInput,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utils';

export const joinCommunity = async (window: Page) => {
  await clickOn(window, HomeScreen.plusButton);
  await clickOn(window, HomeScreen.joinCommunityOption);
  //   The follow two test tags are pending implementation
  await pasteIntoInput(
    window,
    HomeScreen.joinCommunityInput.selector,
    testCommunityLink,
  );
  await clickOn(window, HomeScreen.joinCommunityButton);
  await waitForLoadingAnimationToFinish(window, Global.loadingSpinner.selector);
};

export const joinDefaultCommunity = async (
  window: Page,
  communityName: DefaultCommunity,
) => {
  await clickOn(window, HomeScreen.plusButton);
  await clickOn(window, HomeScreen.joinCommunityOption);
  await waitForMatchingText(window, communityName);
  await clickOnMatchingText(window, communityName);
  // Deliberately do not wait for loading spinner to finish because this takes forever
  await waitForTestIdWithText(
    window,
    HomeScreen.conversationItemName.selector,
    communityName,
  );
};

export const leaveCommunity = async (window: Page, communityName: string) => {
  await clickOnWithText(
    window,
    HomeScreen.conversationItemName,
    communityName,
    { rightButton: true },
  );
  await clickOnWithText(window, Global.contextMenuItem, 'Leave Community');
  await clickOn(window, Global.confirmButton);
  await hasElementBeenDeleted(
    window,
    HomeScreen.conversationItemName.strategy,
    HomeScreen.conversationItemName.selector,
    5_000,
    communityName,
  );
  console.log('Left community');
};

/**
 * There is a race condition where two workers joining the community
 * with the same (admin) account can throw the "You are already a member" error
 * If joining errors (race condition), attempt to find the on-screen error.
 * If the error is visible, the conversation already exists, that's fine,
 * just navigate back and open the convo.
 */
export const joinOrOpenCommunity = async (window: Page) => {
  try {
    await joinCommunity(window);
  } catch (joinError) {
    try {
      await waitForTestIdWithText(
        window,
        Global.errorMessage.selector,
        tStripped('communityJoinedAlready'),
      );
      await clickOn(window, Global.backButton);
      await clickOn(window, Global.backButton);
      await clickOnWithText(
        window,
        HomeScreen.conversationItemName,
        testCommunityName,
      );
    } catch (waitError) {
      // The error message we expected wasn't there, so this is a real failure
      throw joinError; // Throw the original join error, not the wait timeout
    }
  }
};

export const assertAdminIsKnown = () => {
  if (!process.env.SOGS_ADMIN_SEED) {
    console.error('SOGS_ADMIN_SEED required.');
    console.error(
      'Promote a user to admin and set their seed as an env variable to run this test.',
    );
    console.error('CI runs will use a seed saved as a GitHub secret.');
    test.skip();
  }
};
