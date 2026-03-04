import { tStripped } from '../localization/lib';
import { sleepFor } from '../promise_utils';
import { longText, mediaArray, testLink } from './constants/variables';
import { Conversation, HomeScreen } from './locators';
import {
  test_group_Alice_1W_Bob_1W_Charlie_1W,
  test_group_Alice_2W_Bob_1W_Charlie_1W,
} from './setup/sessionTest';
import { deleteMessageFor, sendMessage } from './utilities/message';
import { replyTo, replyToMedia } from './utilities/reply_message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
} from './utilities/send_media';
import {
  clickOnElement,
  clickOnWithText,
  hasTextMessageBeenDeleted,
  pasteIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

mediaArray.forEach(({ mediaType, path, shouldCheckMediaPreview }) => {
  test_group_Alice_1W_Bob_1W_Charlie_1W(
    `Send ${mediaType} to group`,
    async ({
      alice,
      bob,
      aliceWindow1,
      bobWindow1,
      charlieWindow1,
      groupCreated,
    }) => {
      const testMessage = `${alice.userName} sending ${mediaType} to ${groupCreated.userName}`;
      const testReply = `${bob.userName} replying to ${mediaType} from ${alice.userName} in ${groupCreated.userName}`;
      // Send media
      if (mediaType === 'voice') {
        await sendVoiceMessage(aliceWindow1);
      } else {
        await sendMedia(
          aliceWindow1,
          path,
          testMessage,
          shouldCheckMediaPreview,
        );
      }
      if (mediaType === 'document' || mediaType === 'voice') {
        console.log('No loading animation for documents and voice message');
      } else {
        await Promise.all([
          waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation'),
          waitForLoadingAnimationToFinish(charlieWindow1, 'loading-animation'),
        ]);
      }
      if (mediaType === 'voice') {
        await Promise.all([
          waitForTestIdWithText(bobWindow1, 'audio-player'),
          waitForTestIdWithText(charlieWindow1, 'audio-player'),
        ]);
      } else {
        await Promise.all([
          waitForTextMessage(bobWindow1, testMessage),
          waitForTextMessage(charlieWindow1, testMessage),
        ]);
      }
      if (mediaType === 'voice') {
        await replyToMedia({
          senderWindow: bobWindow1,
          locator: Conversation.audioPlayer,
          replyText: testReply,
          receiverWindow: aliceWindow1,
        });
      } else {
        await replyTo({
          senderWindow: bobWindow1,
          textMessage: testMessage,
          replyText: testReply,
          receiverWindow: aliceWindow1,
          shouldCheckMediaPreview,
        });
      }

      // reply was sent from bobWindow1 and awaited from aliceWindow1 already
      await waitForTextMessage(charlieWindow1, testReply);
    },
  );
});

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Send long text to group',
  async ({
    alice,
    bob,
    aliceWindow1,
    bobWindow1,
    charlieWindow1,
    groupCreated,
  }) => {
    const testReply = `${bob.userName} replying to long text message from ${alice.userName} in ${groupCreated.userName}`;
    await pasteIntoInput(aliceWindow1, 'message-input-text-area', longText);
    await sleepFor(100);
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'send-message-button',
    });
    await sleepFor(1000);
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: longText,
      replyText: testReply,
      receiverWindow: charlieWindow1,
    });
    await waitForTextMessage(charlieWindow1, longText);
  },
);

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Send link to group',
  async ({
    alice,
    bob,
    aliceWindow1,
    bobWindow1,
    charlieWindow1,
    groupCreated,
  }) => {
    const testReply = `${bob.userName} replying to link from ${alice.userName} in ${groupCreated.userName}`;
    await sendLinkPreview(aliceWindow1, testLink);
    await Promise.all(
      [bobWindow1, charlieWindow1].map((w) =>
        waitForElement({
          window: w,
          locator: Conversation.linkPreviewTitle,
          options: {
            maxWaitMs: 3_000,
            shouldLog: true,
            text: 'Session | Send Messages, Not Metadata. | Private Messenger',
          },
        }),
      ),
    );

    await replyTo({
      senderWindow: bobWindow1,
      textMessage: testLink,
      replyText: testReply,
      receiverWindow: aliceWindow1,
    });
  },
);

test_group_Alice_2W_Bob_1W_Charlie_1W(
  'Delete message for everyone in group',
  async ({
    aliceWindow1,
    aliceWindow2,
    bobWindow1,
    charlieWindow1,
    groupCreated,
    alice,
    bob,
  }) => {
    // Note: Alice is the admin in this group, Bob is a member without admin rights
    const unsendMessageFromBob1 = `Testing unsend functionality in ${groupCreated.userName} from ${bob.userName} at ${new Date().toISOString()}`;
    // focus the conversation on aliceWindow2 (not done as restored from seed)
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );

    await sendMessage(bobWindow1, unsendMessageFromBob1);
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1].map((w) =>
        waitForTextMessage(w, unsendMessageFromBob1, 15_000),
      ),
    );

    // Bob sent this message, so should be able to delete it for everyone
    await deleteMessageFor(bobWindow1, unsendMessageFromBob1, 'for_everyone');
    // message should be marked as deleted on all devices of all members
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1].map((w) =>
        waitForMatchingText(
          w,
          tStripped('deleteMessageDeletedGlobally'),
          15_000,
        ),
      ),
    );

    // Now, try to remove a new message as Alice (admin) sent by Bob
    console.log(
      `Now, try to remove a new message as ${alice.userName} (admin) sent by ${bob.userName}`,
    );
    const unsendMessageFromBob2 = `Testing unsend functionality in ${groupCreated.userName} from ${bob.userName} at ${new Date().toISOString()}`;
    await sendMessage(bobWindow1, unsendMessageFromBob2);

    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1].map((w) =>
        waitForTextMessage(w, unsendMessageFromBob2),
      ),
    );
    // Bob sent this message, so should be able to delete it for everyone
    await deleteMessageFor(aliceWindow1, unsendMessageFromBob2, 'for_everyone');
    // message should be marked as deleted on all devices of all members
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1].map((w) =>
        waitForMatchingText(
          w,
          tStripped('deleteMessageDeletedGlobally'),
          15_000,
        ),
      ),
    );
  },
);

test_group_Alice_2W_Bob_1W_Charlie_1W(
  'Delete message locally in group',
  async ({
    aliceWindow1,
    aliceWindow2,
    bobWindow1,
    charlieWindow1,
    groupCreated,
    bob,
  }) => {
    const deletedMessageFromBob1 = `Testing delete message functionality in ${groupCreated.userName} from ${bob.userName} at ${new Date().toISOString()}`;
    // focus the conversation on aliceWindow2 (not done as restored from seed)
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );

    await sendMessage(bobWindow1, deletedMessageFromBob1);
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1].map((w) =>
        waitForTextMessage(w, deletedMessageFromBob1, 15_000),
      ),
    );
    // bob can remove locally his own message
    await deleteMessageFor(bobWindow1, deletedMessageFromBob1, 'device_only');
    await hasTextMessageBeenDeleted(bobWindow1, deletedMessageFromBob1, 5000);
    await waitForMatchingText(
      bobWindow1,
      tStripped('deleteMessageDeletedLocally'),
      15_000,
    );
    // Should still be there for Alice and Charlie
    await Promise.all(
      [aliceWindow1, aliceWindow2, charlieWindow1].map((w) =>
        waitForMatchingText(w, deletedMessageFromBob1, 15_000),
      ),
    );

    // Charlie (another normal member) can remove locally messages he didn't send
    const deletedMessageFromBob2 = `Testing delete message functionality in ${groupCreated.userName} from ${bob.userName} at ${new Date().toISOString()}`;
    await sendMessage(bobWindow1, deletedMessageFromBob2);
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1].map((w) =>
        waitForTextMessage(w, deletedMessageFromBob2, 15_000),
      ),
    );
    await deleteMessageFor(
      charlieWindow1,
      deletedMessageFromBob2,
      'device_only',
    );
    await hasTextMessageBeenDeleted(
      charlieWindow1,
      deletedMessageFromBob2,
      5000,
    );
    await waitForMatchingText(
      charlieWindow1,
      tStripped('deleteMessageDeletedLocally'),
      15_000,
    );
    // Should still be there for Alice and Bob
    await Promise.all(
      [aliceWindow1, aliceWindow1, bobWindow1].map((w) =>
        waitForMatchingText(w, deletedMessageFromBob2, 15_000),
      ),
    );
  },
);
