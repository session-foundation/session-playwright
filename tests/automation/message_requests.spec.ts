import { tStripped } from '../localization/lib';
import {
  Conversation,
  Global,
  HomeScreen,
  LeftPane,
  Settings,
} from './locators';
import { test_Alice_1W_Bob_1W } from './setup/sessionTest';
import { openConversationWith } from './utilities/conversation';
import { sendMessage } from './utilities/message';
import { sendNewMessage } from './utilities/send_message';
import {
  checkModalStrings,
  clickOn,
  clickOnMatchingText,
  clickOnWithText,
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
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await openConversationWith(bobWindow1, alice.userName);
    // Check that using the accept button has intended use
    await clickOn(bobWindow1, Conversation.acceptMessageRequestButton);
    // Check config message of message request acceptance
    await waitForTestIdWithText(
      bobWindow1,
      'message-request-response-message',
      tStripped('messageRequestYouHaveAccepted', {
        name: alice.userName,
      }),
    );
    await waitForMatchingText(
      bobWindow1,
      tStripped('messageRequestsNonePending'),
      15_000,
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
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await openConversationWith(bobWindow1, alice.userName);

    await sendMessage(bobWindow1, testReply);
    // Check config message of message request acceptance

    await waitForTestIdWithText(
      bobWindow1,
      'message-request-response-message',
      tStripped('messageRequestYouHaveAccepted', {
        name: alice.userName,
      }),
    );
    await waitForMatchingText(
      bobWindow1,
      tStripped('messageRequestsNonePending'),
      15_000,
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
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select message request from User A
    await openConversationWith(bobWindow1, alice.userName);

    await clickOnWithText(
      bobWindow1,
      Conversation.deleteMessageRequestButton,
      tStripped('delete'),
    );
    // Confirm decline
    await checkModalStrings(
      bobWindow1,
      tStripped('delete'),
      tStripped('messageRequestsDelete'),
    );
    await clickOnWithText(
      bobWindow1,
      Global.confirmButton,
      tStripped('delete'),
    );
    // Check config message of message request acceptance
    await waitForMatchingText(
      bobWindow1,
      tStripped('messageRequestsNonePending'),
      15_000,
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
    await clickOn(bobWindow1, HomeScreen.messageRequestBanner);
    // Select 'Clear All' button
    await clickOnMatchingText(bobWindow1, tStripped('clearAll'));
    // Confirm decline
    await checkModalStrings(
      bobWindow1,
      tStripped('clearAll'),
      tStripped('messageRequestsClearAllExplanation'),
    );
    await clickOnWithText(bobWindow1, Global.confirmButton, tStripped('clear'));
    // Navigate back to message request folder to check
    await clickOn(bobWindow1, LeftPane.settingsButton);

    await clickOnWithText(
      bobWindow1,
      Settings.messageRequestsMenuItem,
      tStripped('sessionMessageRequests'),
    );
    // Check config message of message request acceptance
    await waitForMatchingText(
      bobWindow1,
      tStripped('messageRequestsNonePending'),
      15_000,
    );
  },
);
