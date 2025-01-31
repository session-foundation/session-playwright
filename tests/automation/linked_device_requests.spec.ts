import { englishStrippedStr } from '../locale/localizedString';
import { sleepFor } from '../promise_utils';
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
    await clickOnTestIdWithText(aliceWindow1, 'message-request-banner');
    await clickOnTestIdWithText(aliceWindow2, 'message-request-banner');
    await clickOnTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
      bob.userName,
    );
    await clickOnTestIdWithText(aliceWindow1, 'accept-message-request');
    await waitForTestIdWithText(
      aliceWindow1,
      'message-request-response-message',
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
    await clickOnTestIdWithText(aliceWindow2, 'new-conversation-button');
    await waitForTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
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
    await clickOnTestIdWithText(aliceWindow1, 'message-request-banner');
    await clickOnTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
      bob.userName,
    );
    await clickOnTestIdWithText(aliceWindow2, 'message-request-banner');
    await waitForTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
      bob.userName,
    );
    await sleepFor(1000);
    await clickOnTestIdWithText(
      aliceWindow1,
      'delete-message-request',
      englishStrippedStr('delete').toString(),
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      'session-confirm-ok-button',
      englishStrippedStr('delete').toString(),
    );

    // Note: this test is broken currently but this is a known issue.
    // It happens because we have a race condition between the update from libsession and the update from the swarm, both with the same seqno.
    // See SES-1563
    console.info(
      'This test is subject to a race condition and so is most of the times, broken. See SES-2518',
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
    await clickOnTestIdWithText(aliceWindow1, 'message-request-banner');
    // Select message request from Bob
    await clickOnTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
      bob.userName,
    );
    // Block Bob
    await clickOnTestIdWithText(
      aliceWindow1,
      'decline-and-block-message-request',
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
    await clickOnTestIdWithText(aliceWindow1, 'session-confirm-ok-button');
    // Need to wait for the blocked status to sync
    await sleepFor(2000);
    // Check blocked status in blocked contacts list
    await clickOnTestIdWithText(aliceWindow1, 'settings-section');
    await clickOnTestIdWithText(
      aliceWindow1,
      'conversations-settings-menu-item',
    );
    await clickOnTestIdWithText(aliceWindow1, 'reveal-blocked-user-settings');
    await waitForTestIdWithText(aliceWindow1, 'contact', bob.userName);
    // Check that the blocked contacts is on alicewindow2
    // Check blocked status in blocked contacts list
    await sleepFor(5000);
    await clickOnTestIdWithText(aliceWindow2, 'settings-section');
    await clickOnTestIdWithText(
      aliceWindow2,
      'conversations-settings-menu-item',
    );
    await clickOnTestIdWithText(aliceWindow2, 'reveal-blocked-user-settings');
    await waitForTestIdWithText(aliceWindow2, 'contact', bob.userName);
    await waitForMatchingText(aliceWindow2, bob.userName);
  },
);
