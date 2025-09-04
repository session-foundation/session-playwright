import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { sleepFor } from '../../promise_utils';
import { Conversation, Global, Settings } from '../locators';
import {
  checkModalStrings,
  clickOnMatchingText,
  clickOnTestIdWithText,
} from './utils';

export const makeVoiceCall = async (
  callerWindow: Page,
  receiverWindow: Page,
) => {
  await clickOnTestIdWithText(callerWindow, Conversation.callButton.selector);
  await clickOnTestIdWithText(callerWindow, Global.toast.selector);
  await clickOnTestIdWithText(callerWindow, Settings.enableCalls.selector);
  await checkModalStrings(
    callerWindow,
    englishStrippedStr('callsVoiceAndVideoBeta').toString(),
    englishStrippedStr('callsVoiceAndVideoModalDescription').toString(),
    'confirmModal',
  );
  await clickOnTestIdWithText(callerWindow, Global.confirmButton.selector);
  await clickOnTestIdWithText(callerWindow, Global.modalCloseButton.selector);
  await clickOnTestIdWithText(callerWindow, Conversation.callButton.selector);
  // Enable calls in window B
  await clickOnTestIdWithText(receiverWindow, Global.toast.selector);
  await clickOnTestIdWithText(receiverWindow, Settings.enableCalls.selector);
  await checkModalStrings(
    receiverWindow,
    englishStrippedStr('callsVoiceAndVideoBeta').toString(),
    englishStrippedStr('callsVoiceAndVideoModalDescription').toString(),
    'confirmModal',
  );
  await clickOnTestIdWithText(receiverWindow, Global.confirmButton.selector);
  await clickOnMatchingText(
    receiverWindow,
    englishStrippedStr('accept').toString(),
  );
  await clickOnTestIdWithText(receiverWindow, Global.modalCloseButton.selector);
  await sleepFor(5000);
  await clickOnTestIdWithText(callerWindow, Conversation.endCallButton.selector);
};
