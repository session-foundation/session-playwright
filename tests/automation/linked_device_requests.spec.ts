import { englishStrippedStr } from '../localization/englishStrippedStr';
import { sleepFor } from '../promise_utils';
import {
  Conversation,
  Global,
  HomeScreen,
  LeftPane,
  Settings,
} from './locators';
import { test_Alice_2W_Bob_1W } from './setup/sessionTest';
import { sendMessage } from './utilities/message';
import { sendNewMessage } from './utilities/send_message';
import {
  checkModalStrings,
  clickOnTestIdWithText,
  waitForMatchingText,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

test_Alice_2W_Bob_1W(
  'Accept request syncs',
  async ({ alice, bob, aliceWindow1, aliceWindow2, bobWindow1 }) => {
    const testMessage = `${bob.userName} sending message request to ${alice.userName}`;
    const testReply = `${alice.userName} accepting message request from ${bob.userName}`;
    await sendNewMessage(bobWindow1, alice.accountid, testMessage);
    // Accept request in aliceWindow1
    await clickOnTestIdWithText(
      aliceWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
    await clickOnTestIdWithText(
      aliceWindow2,
      HomeScreen.messageRequestBanner.selector,
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      HomeScreen.conversationItemName.selector,
      bob.userName,
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      Conversation.acceptMessageRequestButton.selector,
    );
    await waitForTestIdWithText(
      aliceWindow1,
      Conversation.messageRequestAcceptControlMessage.selector,
      englishStrippedStr('messageRequestYouHaveAccepted')
        .withArgs({
          name: bob.userName,
        })
        .toString(),
    );
    await waitForMatchingText(
      aliceWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
    await waitForMatchingText(
      aliceWindow2,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
    await sendMessage(aliceWindow1, testReply);
    await waitForTextMessage(bobWindow1, testReply);
    await clickOnTestIdWithText(aliceWindow2, Global.backButton.selector);
    await clickOnTestIdWithText(
      aliceWindow2,
      HomeScreen.newConversationButton.selector,
    );
    await waitForTestIdWithText(
      aliceWindow2,
      Global.contactItem.selector,
      bob.userName,
    );
  },
);

test_Alice_2W_Bob_1W(
  'Decline request syncs',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    const testMessage = `${bob.userName} sending message request to ${alice.userName}`;
    await sendNewMessage(bobWindow1, alice.accountid, testMessage);
    // Decline request in aliceWindow1
    await clickOnTestIdWithText(
      aliceWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      HomeScreen.conversationItemName.selector,
      bob.userName,
    );
    await clickOnTestIdWithText(
      aliceWindow2,
      HomeScreen.messageRequestBanner.selector,
    );
    await waitForTestIdWithText(
      aliceWindow2,
      HomeScreen.conversationItemName.selector,
      bob.userName,
    );
    await sleepFor(1000);
    await clickOnTestIdWithText(
      aliceWindow1,
      Conversation.deleteMessageRequestButton.selector,
      englishStrippedStr('delete').toString(),
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      Global.confirmButton.selector,
      englishStrippedStr('delete').toString(),
    );
    await waitForMatchingText(
      aliceWindow1,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
    await waitForMatchingText(
      aliceWindow2,
      englishStrippedStr('messageRequestsNonePending').toString(),
    );
  },
);

test_Alice_2W_Bob_1W(
  'Message requests block',
  async ({ alice, bob, aliceWindow1, aliceWindow2, bobWindow1 }) => {
    const testMessage = `Sender: ${bob.userName}, Receiver: ${alice.userName}`;
    // send a message to Bob to Alice
    await sendNewMessage(bobWindow1, alice.accountid, `${testMessage}`);
    // Check the message request banner appears and click on it
    await clickOnTestIdWithText(
      aliceWindow1,
      HomeScreen.messageRequestBanner.selector,
    );
    // Select message request from Bob
    await clickOnTestIdWithText(
      aliceWindow1,
      HomeScreen.conversationItemName.selector,
      bob.userName,
    );
    // Block Bob
    await clickOnTestIdWithText(
      aliceWindow1,
      Conversation.blockMessageRequestButton.selector,
    );
    // Check modal strings
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('block').toString(),
      englishStrippedStr('blockDescription')
        .withArgs({ name: bob.userName })
        .toString(),
    );
    // Confirm block
    await clickOnTestIdWithText(aliceWindow1, Global.confirmButton.selector);
    // Need to wait for the blocked status to sync
    await sleepFor(2000);
    // Check blocked status in blocked contacts list
    await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector);
    await clickOnTestIdWithText(
      aliceWindow1,
      Settings.conversationsMenuItem.selector,
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      Settings.blockedContactsButton.selector,
    );
    await waitForTestIdWithText(aliceWindow1, 'contact', bob.userName);
    // Check that the blocked contacts is on alicewindow2
    // Check blocked status in blocked contacts list
    await sleepFor(5000);
    await clickOnTestIdWithText(aliceWindow2, LeftPane.settingsButton.selector);
    await clickOnTestIdWithText(
      aliceWindow2,
      Settings.conversationsMenuItem.selector,
    );
    await clickOnTestIdWithText(
      aliceWindow2,
      Settings.blockedContactsButton.selector,
    );
    await waitForTestIdWithText(aliceWindow2, 'contact', bob.userName);
    await waitForMatchingText(aliceWindow2, bob.userName);
  },
);
