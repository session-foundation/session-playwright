import type { Page } from '@playwright/test';

import { sleepFor } from '../promise_utils';
import {
  longText,
  mediaArray,
  testLink,
  testLinkTitle,
} from './constants/variables';
import { Conversation } from './locators';
import {
  test_group_Alice_1W_Bob_1W_Charlie_1W,
  test_group_Alice_2W_Bob_1W_Charlie_1W,
} from './setup/sessionTest';
import { openConversationWith } from './utilities/conversation';
import {
  confirmMessageDeletedFor,
  deleteMessageFor,
  type MessageDeleteType,
  sendMessage,
} from './utilities/message';
import { replyTo, replyToMedia } from './utilities/reply_message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
} from './utilities/send_media';
import {
  assertUnreachable,
  clickOnElement,
  pasteIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
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
  'Send link preview to group',
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
            text: testLinkTitle,
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

const deleteGroupTypeArray = [
  'device_only_outgoing',
  'device_only_incoming',
  // as normal user, delete one of our own messages
  'for_everyone',
  // as an admin, delete someone else message
  'as_admin_for_everyone',
] as const;

deleteGroupTypeArray.forEach((deleteType) =>
  test_group_Alice_2W_Bob_1W_Charlie_1W(
    `Delete message in group ${deleteType}`,
    async ({
      aliceWindow1,
      aliceWindow2,
      bobWindow1,
      charlieWindow1,
      groupCreated,
      bob,
    }) => {
      // Note: Alice is the admin in this group, Bob is a member without admin rights
      const unsendMessageFromBob = `Testing delete ${deleteType} in group from ${bob.userName}`;
      // focus the conversation on aliceWindow2 (not done as restored from seed)
      await openConversationWith(aliceWindow2, groupCreated.userName);

      await sendMessage(bobWindow1, unsendMessageFromBob);
      await waitForTextMessage(
        [aliceWindow1, aliceWindow2, bobWindow1, charlieWindow1],
        unsendMessageFromBob,
        15_000,
      );

      let windowInitiatingDelete: Page | undefined;
      let fallbackDeleteType: MessageDeleteType | undefined;
      switch (deleteType) {
        case 'device_only_incoming':
          // make Charlie delete Bob's message locally
          windowInitiatingDelete = charlieWindow1;
          fallbackDeleteType = 'device_only';

          break;
        case 'device_only_outgoing':
        case 'for_everyone':
          // Bob sent this message, so should be able to delete it both locally and for everyone
          windowInitiatingDelete = bobWindow1;
          fallbackDeleteType =
            deleteType === 'for_everyone' ? 'for_everyone' : 'device_only';
          break;
        case 'as_admin_for_everyone':
          // Alice (admin) is deleting Bob's message
          windowInitiatingDelete = aliceWindow1;
          fallbackDeleteType = 'for_everyone';
          break;
        default:
          assertUnreachable(deleteType, `assertUnreachable for deleteType`);
          break;
      }
      const otherWindows = [
        aliceWindow1,
        aliceWindow2,
        bobWindow1,
        charlieWindow1,
      ].filter((m) => m !== windowInitiatingDelete);

      // Bob sent this message, so should be able to delete it locally or for everyone
      await deleteMessageFor(
        windowInitiatingDelete,
        unsendMessageFromBob,
        fallbackDeleteType,
      );
      await confirmMessageDeletedFor({
        deleteType: fallbackDeleteType,
        messageToDelete: unsendMessageFromBob,
        windowInitiatingDelete,
        otherWindows,
      });
    },
  ),
);
