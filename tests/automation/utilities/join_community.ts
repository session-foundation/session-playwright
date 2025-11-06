import { Page } from '@playwright/test';

import { testCommunityLink } from '../constants/community';
import { Global, HomeScreen } from '../locators';
import {
  clickOn,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
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
