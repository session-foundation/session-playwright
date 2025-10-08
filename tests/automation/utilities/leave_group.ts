import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { Conversation, Global } from '../locators';
import { Group } from '../types/testing';
import {
  clickOn,
  clickOnMatchingText,
  clickOnWithText,
  hasElementBeenDeleted,
} from './utils';

export const leaveGroup = async (window: Page, group: Group) => {
  // go to three dots menu
  await clickOn(window, Conversation.conversationSettingsIcon);
  // Select Leave Group
  await clickOnMatchingText(
    window,
    englishStrippedStr('groupLeave').toString(),
  );
  // Confirm leave group
  await clickOnWithText(
    window,
    Global.confirmButton,
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
