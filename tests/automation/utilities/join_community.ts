import { Page } from '@playwright/test';

import {
  type DefaultCommunity,
  testCommunityLink,
} from '../constants/community';
import { Global, HomeScreen } from '../locators';
import {
  clickOn,
  clickOnMatchingText,
  clickOnWithText,
  hasElementBeenDeleted,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utils';

export const joinCommunity = async (window: Page) => {
  await clickOn(window, HomeScreen.plusButton);
  await clickOn(window, HomeScreen.joinCommunityOption);
  //   The follow two test tags are pending implementation
  await typeIntoInput(
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
