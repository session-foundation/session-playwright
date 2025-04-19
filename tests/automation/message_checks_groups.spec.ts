import { englishStrippedStr } from '../locale/localizedString';
import { sleepFor } from '../promise_utils';
import { longText, mediaArray, testLink } from './constants/variables';
import { test_group_Alice_1W_Bob_1W_Charlie_1W } from './setup/sessionTest';
import { sendMessage } from './utilities/message';
import { replyTo, replyToMedia } from './utilities/reply_message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
} from './utilities/send_media';
import {
  clickOnElement,
  clickOnMatchingText,
  clickOnTextMessage,
  hasTextMessageBeenDeleted,
  typeIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

mediaArray.forEach(({ mediaType, path }) => {
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
        await sendMedia(aliceWindow1, path, testMessage);
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
          strategy: 'data-testid',
          selector: 'audio-player',
          replyText: testReply,
          receiverWindow: aliceWindow1,
        });
      } else {
        await replyTo({
          senderWindow: bobWindow1,
          textMessage: testMessage,
          replyText: testReply,
          receiverWindow: aliceWindow1,
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
    await typeIntoInput(aliceWindow1, 'message-input-text-area', longText);
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
    await Promise.all([
      waitForElement(
        bobWindow1,
        'class',
        'module-message__link-preview__title',
        undefined,
        'Session | Send Messages, Not Metadata. | Private Messenger',
      ),
      waitForElement(
        charlieWindow1,
        'class',
        'module-message__link-preview__title',
        undefined,
        'Session | Send Messages, Not Metadata. | Private Messenger',
      ),
    ]);
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: testLink,
      replyText: testReply,
      receiverWindow: aliceWindow1,
    });
  },
);

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Unsend message to group',
  async ({ aliceWindow1, bobWindow1, charlieWindow1, groupCreated }) => {
    const unsendMessage = `Testing unsend functionality in ${groupCreated.userName}`;
    await sendMessage(aliceWindow1, unsendMessage);
    await Promise.all([
      waitForTextMessage(bobWindow1, unsendMessage),
      waitForTextMessage(charlieWindow1, unsendMessage),
    ]);
    await clickOnTextMessage(aliceWindow1, unsendMessage, true);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('delete').toString(),
    );
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('clearMessagesForEveryone').toString(),
    );
    // To be implemented in Standardise Message Deletion feature
    // await checkModalStrings(
    //   aliceWindow1,
    //   englishStrippedStr('deleteMessage').withArgs({ count: 1 }).toString(),
    //   englishStrippedStr('deleteMessageConfirm').toString(),
    // );
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'session-confirm-ok-button',
    });
    await waitForTestIdWithText(
      aliceWindow1,
      'session-toast',
      englishStrippedStr('deleteMessageDeleted')
        .withArgs({ count: 1 })
        .toString(),
    );
    await sleepFor(1000);
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('deleteMessageDeletedGlobally').toString(),
    );
    await waitForMatchingText(
      charlieWindow1,
      englishStrippedStr('deleteMessageDeletedGlobally').toString(),
    );
  },
);

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Delete message to group',
  async ({ aliceWindow1, bobWindow1, charlieWindow1, groupCreated }) => {
    const deletedMessage = `Testing delete message functionality in ${groupCreated.userName}`;
    await sendMessage(aliceWindow1, deletedMessage);
    await waitForTextMessage(bobWindow1, deletedMessage);
    await waitForTextMessage(charlieWindow1, deletedMessage);
    await clickOnTextMessage(aliceWindow1, deletedMessage, true);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('delete').toString(),
    );
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('clearMessagesForMe').toString(),
    );
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'session-confirm-ok-button',
    });
    await waitForTestIdWithText(
      aliceWindow1,
      'session-toast',
      englishStrippedStr('deleteMessageDeleted')
        .withArgs({ count: 1 })
        .toString(),
    );
    await hasTextMessageBeenDeleted(aliceWindow1, deletedMessage, 5000);
    await waitForMatchingText(
      aliceWindow1,
      englishStrippedStr('deleteMessageDeletedGlobally').toString(),
    );
    // Should still be there for user B and C
    await waitForMatchingText(bobWindow1, deletedMessage);
    await waitForMatchingText(charlieWindow1, deletedMessage);
  },
);
