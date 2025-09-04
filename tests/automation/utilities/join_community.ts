import { Page } from '@playwright/test';

import { testCommunityLink } from '../constants/community';
import { HomeScreen } from '../locators';
import {
  clickOnTestIdWithText,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
} from './utils';

export const joinCommunity = async (window: Page) => {
  await clickOnTestIdWithText(
    window,
    HomeScreen.plusButton.selector,
  );
  await clickOnTestIdWithText(window, HomeScreen.joinCommunityOption.selector);
  //   The follow two test tags are pending implementation
  await typeIntoInput(
    window,
    HomeScreen.joinCommunityInput.selector,
    testCommunityLink,
  );
  await clickOnTestIdWithText(window, HomeScreen.joinCommunityButton.selector);
  await waitForLoadingAnimationToFinish(window, 'loading-spinner');
};
