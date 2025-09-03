import { Page } from '@playwright/test';
import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { sleepFor } from '../../promise_utils';
import { User } from '../types/testing';
import {
  checkModalStrings,
  clickOnMatchingText,
  clickOnTestIdWithText,
} from './utils';

export const makeVoiceCall = async (
  callerWindow: Page,
  receiverWindow: Page,
  caller: User,
  receiver: User,
) => {
  await clickOnTestIdWithText(callerWindow, 'call-button');
  await clickOnTestIdWithText(callerWindow, 'session-toast');
  await clickOnTestIdWithText(callerWindow, 'enable-calls');
  await checkModalStrings(
    callerWindow,
    englishStrippedStr('callsVoiceAndVideoBeta').toString(),
    englishStrippedStr('callsVoiceAndVideoModalDescription').toString(),
  );
  await clickOnTestIdWithText(callerWindow, 'session-confirm-ok-button');
  await clickOnTestIdWithText(
    callerWindow,
    'module-conversation__user__profile-name',
    receiver.userName,
  );
  await clickOnTestIdWithText(callerWindow, 'call-button');
  // Enable calls in window B
  await clickOnTestIdWithText(receiverWindow, 'session-toast');
  await clickOnTestIdWithText(receiverWindow, 'enable-calls');
  // Getting wrong strings from locales.ts file
  await checkModalStrings(
    receiverWindow,
    englishStrippedStr('callsVoiceAndVideoBeta').toString(),
    englishStrippedStr('callsVoiceAndVideoModalDescription').toString(),
  );
  await clickOnTestIdWithText(receiverWindow, 'session-confirm-ok-button');
  await clickOnMatchingText(
    receiverWindow,
    englishStrippedStr('accept').toString(),
  );
  await clickOnTestIdWithText(
    receiverWindow,
    'module-conversation__user__profile-name',
    caller.userName,
  );
  await sleepFor(5000);
  await clickOnTestIdWithText(callerWindow, 'end-call');
};
