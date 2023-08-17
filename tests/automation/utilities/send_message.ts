import { Page } from '@playwright/test';
import { sendMessage } from './message';
import { clickOnTestIdWithText, typeIntoInput } from './utils';

export const sendNewMessage = async (
  window: Page,
  sessionid: string,
  message: string,
) => {
  await clickOnTestIdWithText(window, 'new-conversation-button');
  await clickOnTestIdWithText(window, 'chooser-new-conversation-button');
  // Enter session ID of USER B
  await typeIntoInput(window, 'new-session-conversation', sessionid);
  // click next
  await clickOnTestIdWithText(window, 'next-new-conversation-button', 'Next');
  await sendMessage(window, message);
};
