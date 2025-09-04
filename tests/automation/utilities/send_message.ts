import { Page } from '@playwright/test';

import { HomeScreen } from '../locators';
import { sendMessage } from './message';
import { clickOnTestIdWithText, typeIntoInput } from './utils';

export const sendNewMessage = async (
  window: Page,
  sessionid: string,
  message: string,
) => {
  await clickOnTestIdWithText(window, HomeScreen.plusButton.selector);
  await clickOnTestIdWithText(window, HomeScreen.newMessageOption.selector);
  // Enter session ID of USER B
  await typeIntoInput(window, 'new-session-conversation', sessionid);
  // click next
  await clickOnTestIdWithText(window, HomeScreen.newMessageNextButton.selector);
  await sendMessage(window, message);
};
