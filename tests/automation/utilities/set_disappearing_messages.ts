import { Page } from '@playwright/test';
import {
  ConversationType,
  DataTestId,
  DisappearOptions,
} from '../types/testing';
import { englishStrippedStr } from '../../localization/englishStrippedStr';
import {
  checkModalStrings,
  clickOnElement,
  clickOnMatchingText,
  clickOnTestIdWithText,
  doWhileWithMax,
  formatTimeOption,
  waitForElement,
  waitForTestIdWithText,
} from './utils';
import { isChecked } from './checked';

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
  await doWhileWithMax(5000, 1000, 'setDisappearingMessages', async () => {
    try {
      await clickOnTestIdWithText(
        windowA,
        'conversation-options-avatar',
        undefined,
        undefined,
        1000,
      );
      await clickOnElement({
        window: windowA,
        strategy: 'data-testid',
        selector: 'disappearing-messages-menu-option',
        maxWait: 100,
      });
      return true;
    } catch (e) {
      console.log(
        'setDisappearingMessages doWhileWithMax action threw:',
        e.message,
      );

      return false;
    }
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
