import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { sleepFor } from '../../promise_utils';
import { Conversation, Global, Settings } from '../locators';
import { checkModalStrings, clickOn, clickOnMatchingText } from './utils';

export const makeVoiceCall = async (
  callerWindow: Page,
  receiverWindow: Page,
) => {
  await clickOn(callerWindow, Conversation.callButton);
  await clickOn(callerWindow, Global.toast);
  await clickOn(callerWindow, Settings.enableCalls);
  await checkModalStrings(
    callerWindow,
    englishStrippedStr('callsVoiceAndVideoBeta').toString(),
    englishStrippedStr('callsVoiceAndVideoModalDescription').toString(),
    'confirmModal',
  );
  await clickOn(callerWindow, Global.confirmButton);
  await clickOn(callerWindow, Global.modalCloseButton);
  await clickOn(callerWindow, Conversation.callButton);
  // Enable calls in window B
  await clickOn(receiverWindow, Global.toast);
  await clickOn(receiverWindow, Settings.enableCalls);
  await checkModalStrings(
    receiverWindow,
    englishStrippedStr('callsVoiceAndVideoBeta').toString(),
    englishStrippedStr('callsVoiceAndVideoModalDescription').toString(),
    'confirmModal',
  );
  await clickOn(receiverWindow, Global.confirmButton);
  await clickOnMatchingText(
    receiverWindow,
    englishStrippedStr('accept').toString(),
  );
  await clickOn(receiverWindow, Global.modalCloseButton);
  await sleepFor(5000);
  await clickOn(callerWindow, Conversation.endCallButton);
};
