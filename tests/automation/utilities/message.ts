import { Page } from '@playwright/test';

import { MessageStatus } from '../types/testing';
// eslint-disable-next-line import/no-cycle
import { clickOnElement, typeIntoInput } from './utils';

export const waitForMessageStatus = async (
  window: Page,
  message: string,
  status: MessageStatus,
) => {
  const selc = `css=[data-testid=message-content]:has-text("${message}"):has([data-testid=msg-status][data-testtype=${status}])`;
  const logSig = `${status} status of message '${message}'`;
  console.info(`waiting for ${logSig}`);

  const messageStatus = await window.waitForSelector(selc, {
    timeout: 20_000,
  });
  console.info(`${logSig} is ${Boolean(messageStatus)}`);
};

export const sendMessage = async (window: Page, message: string) => {
  // type into message input box
  await typeIntoInput(window, 'message-input-text-area', message);
  // click up arrow (send)
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });
  await waitForMessageStatus(window, message, 'sent');
};
