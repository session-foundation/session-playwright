import { Page } from '@playwright/test';
import { testCommunityLink } from '../constants/community';
import { clickOnTestIdWithText, typeIntoInput } from './utils';

export const joinCommunity = async (window: Page) => {
  await clickOnTestIdWithText(window, 'new-conversation-button');
  await clickOnTestIdWithText(window, 'chooser-new-community');
  await typeIntoInput(window, 'new-community-conversation', testCommunityLink);
  await clickOnTestIdWithText(window, 'join-community-button');
};
