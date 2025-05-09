import { Page } from '@playwright/test';
import { testCommunityLink } from '../constants/community';
import {
  clickOnTestIdWithText,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
} from './utils';

export const joinCommunity = async (window: Page) => {
  await clickOnTestIdWithText(window, 'new-conversation-button');
  await clickOnTestIdWithText(window, 'chooser-new-community');
  //   The follow two test tags are pending implementation
  await typeIntoInput(window, 'join-community-conversation', testCommunityLink);
  await clickOnTestIdWithText(window, 'join-community-button');
  await waitForLoadingAnimationToFinish(window, 'loading-spinner');
};
