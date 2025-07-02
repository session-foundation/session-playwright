import { Page } from '@playwright/test';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
  typeIntoInput,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utils';
import { englishStrippedStr } from '../../localization/englishStrippedStr';

export const renameGroup = async (
  window: Page,
  oldGroupName: string,
  newGroupName: string,
) => {
  await clickOnMatchingText(window, oldGroupName);
  await clickOnTestIdWithText(window, 'conversation-options-avatar');
  await clickOnTestIdWithText(window, 'edit-group-name');
  await typeIntoInput(window, 'update-group-info-name-input', newGroupName);
  await window.keyboard.press('Enter');
  await clickOnMatchingText(window, englishStrippedStr('save').toString());
  await waitForTestIdWithText(window, 'group-name', newGroupName);
  await clickOnTestIdWithText(window, 'modal-close-button');
  // Check config message
  await waitForMatchingText(
    window,
    englishStrippedStr('groupNameNew')
      .withArgs({ group_name: newGroupName })
      .toString(),
  );
};
