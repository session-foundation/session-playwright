import { Page } from '@playwright/test';

import { HomeScreen } from '../locators';
import { sendMessage } from './message';
import { clickOn, typeIntoInput } from './utils';

export const sendNewMessage = async (
  window: Page,
  sessionid: string,
  message: string,
) => {
  await clickOn(window, HomeScreen.plusButton);
  await clickOn(window, HomeScreen.newMessageOption);
  // Enter session ID of USER B
  await typeIntoInput(window, 'new-session-conversation', sessionid);
  // click next
  await clickOn(window, HomeScreen.newMessageNextButton);
  await sendMessage(window, message);
};
