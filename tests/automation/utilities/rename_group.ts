import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
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
  await clickOnMatchingText(window, englishStrippedStr('save').toString());
  await waitForTestIdWithText(window, 'group-name', newGroupName);
  await clickOn(window, Global.modalCloseButton);
  // Check config message
  await waitForMatchingText(
    window,
    englishStrippedStr('groupNameNew')
      .withArgs({ group_name: newGroupName })
      .toString(),
  );
};
