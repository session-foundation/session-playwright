import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { Conversation, Global } from '../locators';
import { Group } from '../types/testing';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
  hasElementBeenDeleted,
} from './utils';

export const leaveGroup = async (window: Page, group: Group) => {
  // go to three dots menu
  await clickOnTestIdWithText(
    window,
    Conversation.conversationSettingsIcon.selector,
  );
  // Select Leave Group
  await clickOnMatchingText(
    window,
    englishStrippedStr('groupLeave').toString(),
  );
  // Confirm leave group
  await clickOnTestIdWithText(
    window,
    Global.confirmButton.selector,
    englishStrippedStr('leave').toString(),
  );
  // check config message
  await hasElementBeenDeleted(
    window,
    'data-testid',
    'module-conversation__user__profile-name',
    undefined,
    group.userName,
  );
};
