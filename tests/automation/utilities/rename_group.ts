import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { Conversation, ConversationSettings, Global } from '../locators';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
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
  await clickOnTestIdWithText(
    window,
    Conversation.conversationSettingsIcon.selector,
  );
  await clickOnTestIdWithText(
    window,
    ConversationSettings.editGroupButton.selector,
  );
  await typeIntoInput(window, 'update-group-info-name-input', newGroupName);
  await window.keyboard.press('Enter');
  await clickOnMatchingText(window, englishStrippedStr('save').toString());
  await waitForTestIdWithText(window, 'group-name', newGroupName);
  await clickOnTestIdWithText(window, Global.modalCloseButton.selector);
  // Check config message
  await waitForMatchingText(
    window,
    englishStrippedStr('groupNameNew')
      .withArgs({ group_name: newGroupName })
      .toString(),
  );
};
