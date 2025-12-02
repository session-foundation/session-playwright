import { Page } from '@playwright/test';

import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { sleepFor } from '../../promise_utils';
import { Conversation, Global, Settings } from '../locators';
import { MediaType } from '../types/testing';
import { waitForSentTick } from './message';
import {
  checkModalStrings,
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  clickOnWithText,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utils';

/**
 * Verify media preview loaded by checking screenshot buffer size
 * Pixel matching and other image metadata approaches were all too unreliable.
 * A broken image has the exact same appearance in the DOM as a loaded one. 
 * Waits for loading animation to finish before checking
 * Throws if media fails to load
 */
export const verifyMediaPreviewLoaded = async (
  page: Page,
  textMessage: string,
  timeout = 10_000,
  sampleIntervalMs = 150,
): Promise<void> => {
  const brokenFileSizeThreshold = 5_000; // 5 kB is considered broken
  console.log(`Verifying media preview for: "${textMessage}"`);

  await waitForTextMessage(page, textMessage);

  const container = page
    .locator('[data-testid="message-content"]')
    .filter({ hasText: textMessage });

  const media = container.locator('[data-attachmentindex="0"]');
  await media.waitFor({ state: 'visible', timeout: 5000 });

  const spinner = media.locator('[data-testid="loading-animation"]');
  if (await spinner.count()) {
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 });
  }

  const img = media.locator('img.module-image__image').first();

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const src = await img.getAttribute('src');
    if (src) {
      await sleepFor(500); // Allow time for image to fully load
      const screenshot = await img.screenshot({ type: 'png' });
      if (screenshot.length >= brokenFileSizeThreshold) {
        console.log(`✓ Media loaded (PNG ${screenshot.length} bytes)`);
        return;
      }
    }
    await sleepFor(sampleIntervalMs);
  }

  throw new Error(`Media preview failed to load within ${timeout}ms`);
};

export const sendMedia = async (
  window: Page,
  path: string,
  testMessage: string,
  shouldCheckMediaPreview: boolean = false,
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
  if (shouldCheckMediaPreview) {
    await verifyMediaPreviewLoaded(window, testMessage);
  }
};

export const sendVoiceMessage = async (window: Page) => {
  await clickOn(window, Conversation.microphoneButton);
  await clickOn(window, Global.toast);
  await clickOn(window, Settings.enableMicrophone);
  await clickOn(window, Global.modalCloseButton);
  await clickOn(window, Conversation.microphoneButton);
  await sleepFor(5000);
  await clickOn(window, Conversation.endVoiceMessageButton);
  await sleepFor(4000);
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });
  const selc = `css=[data-testid=msg-status][data-testtype=sent]`;
  await window.waitForSelector(selc, {
    timeout: 30000,
  });
};

export const sendLinkPreview = async (window: Page, testLink: string) => {
  await typeIntoInput(window, 'message-input-text-area', testLink);
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });
  await clickOnWithText(window, Conversation.messageContent, testLink, {
    rightButton: true,
  });
  // Need to copy link to clipboard, as the enable link preview modal
  // doesn't pop up if manually typing link (needs to be pasted)
  // Need to have a nth(0) here to account for Copy Account ID, Appium was getting confused
  // Tried to use englishStripped here but Playwright doesn't like it
  // const copyText = englishStrippedStr('copy').toString();
  // eslint-disable-next-line
  const firstCopyBtn = window
    .locator(`[data-testid=context-menu-item]:has-text("Copy")`)
    .nth(0);
  await firstCopyBtn.click();
  await waitForTestIdWithText(
    window,
    'session-toast',
    englishStrippedStr('copied').toString(),
  );
  // click on the toast and wait for it to be closed to avoid the layout shift
  await clickOn(window, Global.toast);
  await sleepFor(1000);
  await clickOn(window, Conversation.messageInput);
  const isMac = process.platform === 'darwin';
  await window.keyboard.press(`${isMac ? 'Meta' : 'Control'}+V`);
  await checkModalStrings(
    window,
    englishStrippedStr('linkPreviewsEnable').toString(),
    englishStrippedStr('linkPreviewsFirstDescription').toString(),
  );
  await clickOnWithText(
    window,
    Global.confirmButton,
    englishStrippedStr('enable').toString(),
  );
  await waitForLoadingAnimationToFinish(window, Global.loadingSpinner.selector);
  await waitForTestIdWithText(window, 'link-preview-image');
  await waitForTestIdWithText(
    window,
    'link-preview-title',
    'Session | Send Messages, Not Metadata. | Private Messenger',
  );
  await clickOnElement({
    window,
    strategy: 'data-testid',
    selector: 'send-message-button',
  });

  await waitForSentTick(window, testLink);
};

export const trustUser = async (
  window: Page,
  mediaType: MediaType,
  userName: string,
) => {
  await clickOnMatchingText(
    window,
    englishStrippedStr('attachmentsClickToDownload')
      .withArgs({
        file_type: englishStrippedStr(mediaType).toString().toLowerCase(),
      })
      .toString(),
  );
  await checkModalStrings(
    window,
    englishStrippedStr('attachmentsAutoDownloadModalTitle').toString(),
    englishStrippedStr('attachmentsAutoDownloadModalDescription')
      .withArgs({
        conversation_name: userName,
      })
      .toString(),
  );
  await clickOnWithText(
    window,
    Global.confirmButton,
    englishStrippedStr('yes').toString(),
  );
};
