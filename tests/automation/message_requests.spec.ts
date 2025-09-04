import { englishStrippedStr } from '../localization/englishStrippedStr';
import { Conversation, HomeScreen, LeftPane } from './locators';
import { test_Alice_1W_Bob_1W } from './setup/sessionTest';
import { sendMessage } from './utilities/message';
import { sendNewMessage } from './utilities/send_message';
import {
  checkModalStrings,
  clickOnMatchingText,
  clickOnTestIdWithText,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utilities/utils';

// Open two windows and log into 2 separate accounts
test_Alice_1W_Bob_1W(
  'Message requests accept',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName} Receiver: ${bob.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
    // Select message request from User A
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.conversationItemName.selector,
      alice.userName,
    );
    // Check that using the accept button has intended use
    await clickOnTestIdWithText(
      bobWindow1,
      Conversation.acceptMessageRequestButton.selector,
    );
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

test_Alice_1W_Bob_1W(
  'Message requests text reply',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName}, Receiver: ${bob.userName}`;
    const testReply = `Sender: ${bob.userName}, Receiver: ${alice.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
    // Select message request from User A
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.conversationItemName.selector,
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

test_Alice_1W_Bob_1W(
  'Message requests decline',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName}, Receiver: ${bob.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
    // Select message request from User A
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.conversationItemName.selector,
      alice.userName,
    );

    await clickOnTestIdWithText(
      bobWindow1,
      'delete-message-request',
      englishStrippedStr('delete').toString(),
    );
    // Confirm decline
    await checkModalStrings(
      bobWindow1,
      englishStrippedStr('delete').toString(),
      englishStrippedStr('messageRequestsDelete').toString(),
    );
    await clickOnTestIdWithText(
      bobWindow1,
      'session-confirm-ok-button',
      englishStrippedStr('delete').toString(),
    );
    // Check config message of message request acceptance
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);

test_Alice_1W_Bob_1W(
  'Message requests clear all',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testMessage = `Sender: ${alice.userName}, Receiver: ${bob.userName}`;
    // send a message to User B from User A
    await sendNewMessage(aliceWindow1, bob.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOnTestIdWithText(
      bobWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
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
    await clickOnTestIdWithText(
      bobWindow1,
      'session-confirm-ok-button',
      englishStrippedStr('clear').toString(),
    );
    // Navigate back to message request folder to check
    await clickOnTestIdWithText(bobWindow1, LeftPane.settingsButton.selector);

    await clickOnTestIdWithText(
      bobWindow1,
      'message-requests-settings-menu-item',
      englishStrippedStr('sessionMessageRequests').toString(),
    );
    // Check config message of message request acceptance
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);
