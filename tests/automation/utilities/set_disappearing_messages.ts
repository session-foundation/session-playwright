import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { Conversation, ConversationSettings } from '../locators';
import {
  ConversationType,
  DataTestId,
  DisappearOptions,
} from '../types/testing';
import { isChecked } from './checked';
import {
  checkModalStrings,
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  formatTimeOption,
  waitForElement,
  waitForTestIdWithText,
} from './utils';

export const setDisappearingMessages = async (
  windowA: Page,
  [
    conversationType,
    timerType,
    timerDuration,
    disappearAction,
  ]: DisappearOptions,
  windowB?: Page,
) => {
  const enforcedType: ConversationType = conversationType;
  await clickOn(windowA, Conversation.conversationSettingsIcon, {
    maxWait: 5_000,
  });
  await clickOnElement({
    window: windowA,
    strategy: 'data-testid',
    selector: ConversationSettings.disappearingMessagesOption.selector,
    maxWait: 5_000,
  });

  if (enforcedType === '1:1') {
    await clickOnElement({
      window: windowA,
      strategy: 'data-testid',
      selector: timerType,
    });
    // Check that 1 Day default is automatically selected (default time is only relevant to 1:1's)
    let defaultTime;
    if (timerType === 'disappear-after-read-option') {
      // making explicit DataTestId here as `waitForElement` currently allows a string
      // TODO: add explicit typing to waitForElement
      const dataTestId: DataTestId = 'input-time-option-12-hours';
      defaultTime = await waitForElement(windowA, 'data-testid', dataTestId);
    } else {
      // making explicit DataTestId here as `waitForElement` currently allows a string
      // TODO: add explicit typing to waitForElement
      const dataTestId: DataTestId = 'input-time-option-1-days';

      defaultTime = await waitForElement(
        windowA,
        'data-testid',
        dataTestId,
        1000,
      );
    }
    const checked = await isChecked(defaultTime);
    if (checked) {
      console.info('Timer default time is correct');
    } else {
      throw new Error('Default timer not set correctly');
    }
  }

  // Change timer to testing duration (10 seconds)
  await clickOnElement({
    window: windowA,
    strategy: 'data-testid',
    selector: timerDuration,
  });
  await clickOnElement({
    window: windowA,
    strategy: 'data-testid',
    selector: 'disappear-set-button',
  });
  await clickOnElement({
    window: windowA,
    strategy: 'data-testid',
    selector: 'modal-close-button',
  });
  await waitForTestIdWithText(windowA, 'disappear-messages-type-and-time');
  if (windowB) {
    await clickOnMatchingText(
      windowB,
      englishStrippedStr('disappearingMessagesFollowSetting').toString(),
    );

    let action;
    if (disappearAction === 'read') {
      action = englishStrippedStr('disappearingMessagesTypeRead').toString();
    } else {
      action = englishStrippedStr('disappearingMessagesTypeSent').toString();
    }

    const formattedTime = formatTimeOption(timerDuration);

    const modalDescription = englishStrippedStr(
      'disappearingMessagesFollowSettingOn',
    )
      .withArgs({ time: formattedTime, disappearing_messages_type: action })
      .toString();

    await checkModalStrings(
      windowB,
      englishStrippedStr('disappearingMessagesFollowSetting').toString(),
      modalDescription,
    );
    await clickOnElement({
      window: windowB,
      strategy: 'data-testid',
      selector: 'session-confirm-ok-button',
    });
    await waitForTestIdWithText(windowB, 'disappear-messages-type-and-time');
  }
};
