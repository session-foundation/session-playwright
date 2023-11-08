import { Page } from '@playwright/test';
import { clickOnElement, typeIntoInput } from './utils';

export const sendMessage = async (window: Page, message: string) => {
  // type into message input box
  await typeIntoInput(window, 'message-input-text-area', message);
  // click up arrow (send)
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });
  // wait for confirmation tick to send reply message
  const selc = `css=[data-testid=message-content]:has-text("${message}"):has([data-testid=msg-status-outgoing][data-testtype=sent])`;
  console.error('waiting for sent tick of message: ', message);

  const tickMessageSent = await window.waitForSelector(selc, {
    timeout: 30000,
  });
  console.error(
    'found the tick of message sent: ',
    message,
    Boolean(tickMessageSent),
  );
};
