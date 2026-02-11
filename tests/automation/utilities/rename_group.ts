import { Page } from '@playwright/test';

import { tStripped } from '../../localization/lib';
import { Conversation, ConversationSettings, Global } from '../locators';
import {
  clickOn,
  clickOnMatchingText,
  typeIntoInput,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utils';

export const renameGroup = async (
  window: Page,
  oldGroupName: string,
  newGroupName: string,
) => {
  await clickOnMatchingText(window, oldGroupName);
  await clickOn(window, Conversation.conversationSettingsIcon);
  await clickOn(window, ConversationSettings.editGroupButton);
  await typeIntoInput(window, 'update-group-info-name-input', newGroupName);
  await window.keyboard.press('Enter');
  await clickOnMatchingText(window, tStripped('save'));
  await waitForTestIdWithText(window, 'group-name', newGroupName);
  await clickOn(window, Global.modalCloseButton);
  // Check config message
  await waitForMatchingText(
    window,
    tStripped('groupNameNew', { group_name: newGroupName }),
  );
};
