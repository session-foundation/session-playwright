import { Page } from '@playwright/test';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
  typeIntoInput,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utils';
import { englishStrippedStr } from '../../locale/localizedString';

export const renameGroup = async (
  window: Page,
  oldGroupName: string,
  newGroupName: string,
) => {
  await clickOnMatchingText(window, oldGroupName);
  await clickOnTestIdWithText(window, 'conversation-options-avatar');
  await clickOnTestIdWithText(window, 'edit-group-name');
  await typeIntoInput(window, 'group-name-input', newGroupName);
  await window.keyboard.press('Enter');
  await clickOnMatchingText(window, englishStrippedStr('okay').toString());
  await waitForTestIdWithText(window, 'right-panel-group-name', newGroupName);
  await clickOnTestIdWithText(window, 'back-button-conversation-options');
  // Check config message
  await waitForMatchingText(
    window,
    englishStrippedStr('groupNameNew')
      .withArgs({ group_name: newGroupName })
      .toString(),
  );
};
