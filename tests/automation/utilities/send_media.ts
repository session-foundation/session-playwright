import { Page } from '@playwright/test';
import { waitForSentTick } from './message';
import { clickOnElement, typeIntoInput } from './utils';

export const sendImage = async (window: Page, testMessage: string) => {
  // Send image
  await window.setInputFiles("input[type='file']", 'fixtures/test-image.png');
  await typeIntoInput(window, 'message-input-text-area', testMessage);
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });
  await waitForSentTick(window, testMessage);
};
