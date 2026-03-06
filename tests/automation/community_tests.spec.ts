import { expect } from '@playwright/test';

import { tStripped } from '../localization/lib';
import { testCommunityName } from './constants/community';
import { Global, HomeScreen, LeftPane, Settings } from './locators';
import { test_Alice_1W_Bob_1W, test_Alice_2W } from './setup/sessionTest';
import { openConversationWith } from './utilities/conversation';
import { joinCommunity } from './utilities/join_community';
import { sendMessage } from './utilities/message';
import { replyTo } from './utilities/reply_message';
import { sendMedia } from './utilities/send_media';
import {
  clickOn,
  grabTextFromElement,
  scrollToBottomIfNecessary,
  waitForTestIdWithText,
} from './utilities/utils';

test_Alice_2W(
  'Join community and sync',
  async ({ aliceWindow1, aliceWindow2 }) => {
    await joinCommunity(aliceWindow1);
    await scrollToBottomIfNecessary(aliceWindow1);
    await sendMessage(aliceWindow1, 'Hello, community!');
    // Check linked device for community

    await openConversationWith(aliceWindow2, testCommunityName);
  },
);

test_Alice_1W_Bob_1W(
  'Send image to community',
  async ({ alice, bob, aliceWindow1, bobWindow1 }) => {
    const mediaPath = 'sample_files/test-image.png';
    const testImageMessage = `Image message + ${Date.now()} + desktop`;
    const testReply = `${bob.userName} replying to image from ${alice.userName}`;
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    // await Promise.all([
    //   waitForLoadingAnimationToFinish(aliceWindow1, 'loading-spinner'),
    //   waitForLoadingAnimationToFinish(bobWindow1, 'loading-spinner'),
    // ]);
    await Promise.all(
      [aliceWindow1, bobWindow1].map((window) =>
        scrollToBottomIfNecessary(window),
      ),
    );
    await sendMedia(aliceWindow1, mediaPath, testImageMessage, true);
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: testImageMessage,
      replyText: testReply,
      receiverWindow: aliceWindow1,
      shouldCheckMediaPreview: true,
    });
  },
);

test_Alice_1W_Bob_1W(
  'Community message requests on',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    await clickOn(bobWindow1, LeftPane.settingsButton);
    await clickOn(bobWindow1, Settings.privacyMenuItem);
    await clickOn(bobWindow1, Settings.enableCommunityMessageRequests);
    await clickOn(bobWindow1, Global.modalCloseButton);
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    const communityMsg = `I accept message requests + ${Date.now()}`;
    await sendMessage(bobWindow1, communityMsg);
    await scrollToBottomIfNecessary(aliceWindow1);
    // Using native methods to locate the author corresponding to the sent message
    await aliceWindow1
      .locator('.module-message__container', { hasText: communityMsg })
      .locator('..') // Go up to parent
      .locator('svg')
      .click();
    const elText = await grabTextFromElement(
      aliceWindow1,
      'data-testid',
      'account-id',
    );
    expect(elText).toMatch(/^15/);
    await clickOn(aliceWindow1, HomeScreen.newMessageAccountIDInput); // yes this is the actual locator for the 'Message' button
    await waitForTestIdWithText(
      aliceWindow1,
      'header-conversation-name',
      bob.userName,
    );
    const messageRequestMsg = `${alice.userName} to ${bob.userName}`;
    const messageRequestResponse = `${bob.userName} accepts message request`;
    await sendMessage(aliceWindow1, messageRequestMsg);
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await openConversationWith(bobWindow1, alice.userName);
    await sendMessage(bobWindow1, messageRequestResponse);
    // Check config message of message request acceptance
    await waitForTestIdWithText(
      bobWindow1,
      'message-request-response-message',
      tStripped('messageRequestYouHaveAccepted', {
        name: alice.userName,
      }),
    );
  },
);
test_Alice_1W_Bob_1W(
  'Community message requests off',
  async ({ aliceWindow1, bobWindow1 }) => {
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    const communityMsg = `I do not accept message requests + ${Date.now()}`;
    await sendMessage(bobWindow1, communityMsg);
    await scrollToBottomIfNecessary(aliceWindow1);
    // Using native methods to locate the author corresponding to the sent message
    await aliceWindow1
      .locator('.module-message__container', { hasText: communityMsg })
      .locator('..') // Go up to parent
      .locator('svg')
      .click();
    const elText = await grabTextFromElement(
      aliceWindow1,
      'data-testid',
      'account-id',
    );
    expect(elText).toMatch(/^15/);
    const messageButton = aliceWindow1.getByTestId(
      HomeScreen.newMessageAccountIDInput.selector,
    );
    await expect(messageButton).toHaveClass(/disabled/);
  },
);
