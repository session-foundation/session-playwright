import { Page } from '@playwright/test';
import { waitForSentTick } from './message';
import { clickOnElement, typeIntoInput } from './utils';

export const sendMedia = async (
  window: Page,
  path: string,
  testMessage: string,
) => {
  // Send media
  await window.setInputFiles("input[type='file']", `${path}`);
  await typeIntoInput(window, 'message-input-text-area', testMessage);
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });
  await waitForSentTick(window, testMessage);
};
