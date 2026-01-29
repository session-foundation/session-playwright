import { expect } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import {
  Conversation,
  Global,
  HomeScreen,
  LeftPane,
  Settings,
} from './locators';
import { test_Alice1_Bob1 } from './setup/sessionTest';
import { joinCommunity } from './utilities/join_community';
import { sendMessage } from './utilities/message';
import { sendNewMessage } from './utilities/send_message';
import {
  checkModalStrings,
  clickOn,
  clickOnMatchingText,
  clickOnWithText,
  grabTextFromElement,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utilities/utils';

// Open two windows and log into 2 separate accounts
test_Alice1_Bob1(
  'Message requests accept',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName} Receiver: ${bob.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await clickOnWithText(
      bobWindow1,
      HomeScreen.conversationItemName,
      alice.userName,
    );
    // Check that using the accept button has intended use
    await clickOn(bobWindow1, Conversation.acceptMessageRequestButton);
    // Check config message of message request acceptance
    await waitForTestIdWithText(
      bobWindow1,
      'message-request-response-message',
      englishStrippedStr('messageRequestYouHaveAccepted')
        .withArgs({
          name: alice.userName,
        })
        .toString(),
    );
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);

test_Alice1_Bob1(
  'Message requests text reply',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName}, Receiver: ${bob.userName}`;
    const testReply = `Sender: ${bob.userName}, Receiver: ${alice.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await clickOnWithText(
      bobWindow1,
      HomeScreen.conversationItemName,
      alice.userName,
    );
    await sendMessage(bobWindow1, testReply);
    // Check config message of message request acceptance

    await waitForTestIdWithText(
      bobWindow1,
      'message-request-response-message',
      englishStrippedStr('messageRequestYouHaveAccepted')
        .withArgs({
          name: alice.userName,
        })
        .toString(),
    );
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);

test_Alice1_Bob1(
  'Message requests decline',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName}, Receiver: ${bob.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await clickOnWithText(
      bobWindow1,
      HomeScreen.conversationItemName,
      alice.userName,
    );

    await clickOnWithText(
      bobWindow1,
      Conversation.deleteMessageRequestButton,
      englishStrippedStr('delete').toString(),
    );
    // Confirm decline
    await checkModalStrings(
      bobWindow1,
      englishStrippedStr('delete').toString(),
      englishStrippedStr('messageRequestsDelete').toString(),
    );
    await clickOnWithText(
      bobWindow1,
      Global.confirmButton,
      englishStrippedStr('delete').toString(),
    );
    // Check config message of message request acceptance
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);

test_Alice1_Bob1(
  'Message requests clear all',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName}, Receiver: ${bob.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select 'Clear All' button
    await clickOnMatchingText(
      bobWindow1,
      englishStrippedStr('clearAll').toString(),
    );
    // Confirm decline
    await checkModalStrings(
      bobWindow1,
      englishStrippedStr('clearAll').toString(),
      englishStrippedStr('messageRequestsClearAllExplanation').toString(),
    );
    await clickOnWithText(
      bobWindow1,
      Global.confirmButton,
      englishStrippedStr('clear').toString(),
    );
    // Navigate back to message request folder to check
    await clickOn(bobWindow1, LeftPane.settingsButton);

    await clickOnWithText(
      bobWindow1,
      Settings.messageRequestsMenuItem,
      englishStrippedStr('sessionMessageRequests').toString(),
    );
    // Check config message of message request acceptance
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);

test_Alice1_Bob1(
  'Community message requests on',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    await clickOn(bobWindow1, LeftPane.settingsButton);
    await clickOn(bobWindow1, Settings.privacyMenuItem);
    await clickOn(bobWindow1, Settings.enableCommunityMessageRequests);
    await clickOn(bobWindow1, Global.modalCloseButton);
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    const communityMsg = `I accept message requests + ${Date.now()}`;
    await sendMessage(bobWindow1, communityMsg);
    await clickOn(aliceWindow1, Conversation.scrollToBottomButton);
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
    await clickOnWithText(
      bobWindow1,
      HomeScreen.conversationItemName,
      alice.userName,
    );
    await sendMessage(bobWindow1, messageRequestResponse);
    // Check config message of message request acceptance
    await waitForTestIdWithText(
      bobWindow1,
      'message-request-response-message',
      englishStrippedStr('messageRequestYouHaveAccepted')
        .withArgs({
          name: alice.userName,
        })
        .toString(),
    );
  },
);
test_Alice1_Bob1(
  'Community message requests off',
  async ({ aliceWindow1, bobWindow1 }) => {
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    const communityMsg = `I do not accept message requests + ${Date.now()}`;
    await sendMessage(bobWindow1, communityMsg);
    await clickOn(aliceWindow1, Conversation.scrollToBottomButton);
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
