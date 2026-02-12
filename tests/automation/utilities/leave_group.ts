import { Page } from '@playwright/test';

import { tStripped } from '../../localization/lib';
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
  await clickOnMatchingText(window, tStripped('groupLeave'));
  // Confirm leave group
  await clickOnWithText(window, Global.confirmButton, tStripped('leave'));
  // check config message
  await hasElementBeenDeleted(
    window,
    'data-testid',
    'module-conversation__user__profile-name',
    5_000,
    group.userName,
  );
};
