import { englishStrippedStr } from '../locale/localizedString';
import { sleepFor } from '../promise_utils';
import { testCommunityName } from './constants/community';
import { longText } from './constants/variables';
import { newUser } from './setup/new_user';
import {
  sessionTestTwoWindows,
  test_Alice_1W_Bob_1W,
} from './setup/sessionTest';
import { MediaType } from './types/testing';
import { createContact } from './utilities/create_contact';
import { joinCommunity } from './utilities/join_community';
import { sendMessage, waitForSentTick } from './utilities/message';
import { replyTo, replyToMedia } from './utilities/reply_message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
  trustUser,
} from './utilities/send_media';
import {
  clickOnElement,
  clickOnMatchingText,
  clickOnTestIdWithText,
  clickOnTextMessage,
  hasTextMessageBeenDeleted,
  measureSendingTime,
  typeIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

[
  {
    mediaType: 'image',
    path: 'fixtures/test-image.png',
    mediaTag: 'media',
  },
  {
    mediaType: 'video',
    path: 'fixtures/test-video.mp4',
    mediaTag: 'media',
  },
  {
    mediaType: 'gif',
    path: 'fixtures/test-gif.gif',
    mediaTag: 'media',
  },
  {
    mediaType: 'document',
    path: 'fixtures/test-file.pdf',
    mediaTag: 'file',
  },
  {
    mediaType: 'voice',
    path: '',
    mediaTag: 'audio',
  },
].forEach(({ mediaType, path, mediaTag }) => {
  test_Alice_1W_Bob_1W(
    `Send ${mediaType} 1:1`,
    async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
      const testMessage = `${alice.userName} sending ${mediaType} to ${bob.userName}`;
      const testReply = `${bob.userName} replying to ${mediaType} from ${alice.userName}`;
      await createContact(aliceWindow1, bobWindow1, alice, bob);
      if (mediaType === 'voice') {
        await sendVoiceMessage(aliceWindow1);
      } else {
        await sendMedia(aliceWindow1, path, testMessage);
      }
      // Click on untrusted attachment in window B
      await sleepFor(1000);
      await trustUser(bobWindow1, alice.userName, mediaTag as MediaType);
      await waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation');
      // Waiting for image to change from loading state to loaded (takes a second)
      await sleepFor(1000);
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
    },
  );
});

test_Alice_1W_Bob_1W(
  'Send long text 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testReply = `${bob.userName} replying to long text message from ${alice.userName}`;
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await typeIntoInput(aliceWindow1, 'message-input-text-area', longText);
    await sleepFor(100);
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'send-message-button',
    });
    await waitForSentTick(aliceWindow1, longText);
    await sleepFor(1000);
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: longText,
      replyText: testReply,
      receiverWindow: aliceWindow1,
    });
  },
);

test_Alice_1W_Bob_1W(
  'Send link 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testLink = 'https://getsession.org/';
    const testReply = `${bob.userName} replying to link from ${alice.userName}`;

    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendLinkPreview(aliceWindow1, testLink);
    await waitForElement(
      bobWindow1,
      'class',
      'module-message__link-preview__title',
      undefined,
      'Session | Send Messages, Not Metadata. | Private Messenger',
    );
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: testLink,
      replyText: testReply,
      receiverWindow: aliceWindow1,
    });
  },
);

test_Alice_1W_Bob_1W(
  'Send community invite',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await joinCommunity(aliceWindow1);
    await clickOnTestIdWithText(aliceWindow1, 'conversation-options-avatar');
    await clickOnTestIdWithText(aliceWindow1, 'add-user-button');
    await waitForTestIdWithText(
      aliceWindow1,
      'modal-heading',
      englishStrippedStr('membersInvite').toString(),
    );
    await clickOnTestIdWithText(aliceWindow1, 'contact', bob.userName);
    await clickOnTestIdWithText(aliceWindow1, 'session-confirm-ok-button');
    await clickOnTestIdWithText(aliceWindow1, 'modal-close-button');
    await clickOnTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
      bob.userName,
    );
    await Promise.all([
      waitForElement(
        aliceWindow1,
        'class',
        'group-name',
        undefined,
        testCommunityName,
      ),
      waitForElement(
        bobWindow1,
        'class',
        'group-name',
        undefined,
        testCommunityName,
      ),
    ]);
  },
);

test_Alice_1W_Bob_1W(
  'Unsend message 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const unsendMessage = 'Testing unsend functionality';
    await createContact(aliceWindow1, bobWindow1, alice, bob);

    await sendMessage(aliceWindow1, unsendMessage);
    await waitForTextMessage(bobWindow1, unsendMessage);
    await clickOnTextMessage(aliceWindow1, unsendMessage, true);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('delete').toString(),
    );
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('clearMessagesForEveryone').toString(),
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
    await sleepFor(1000);
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('deleteMessageDeleted')
        .withArgs({ count: 1 })
        .toString(),
    );
  },
);

test_Alice_1W_Bob_1W(
  'Delete message 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const deletedMessage = 'Testing deletion functionality';
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendMessage(aliceWindow1, deletedMessage);
    await waitForTextMessage(bobWindow1, deletedMessage);
    await clickOnTextMessage(aliceWindow1, deletedMessage, true);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('delete').toString(),
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
    await hasTextMessageBeenDeleted(aliceWindow1, deletedMessage, 1000);
    // Still should exist in window B
    await waitForMatchingText(bobWindow1, deletedMessage);
  },
);

sessionTestTwoWindows(
  'Check performance',
  async ([aliceWindow1, bobWindow1]) => {
    const [alice, bob] = await Promise.all([
      newUser(aliceWindow1, 'Alice'),
      newUser(bobWindow1, 'Bob'),
    ]);
    // Create contact
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    const timesArray: Array<number> = [];

    let i;
    for (i = 1; i <= 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      const timeMs = await measureSendingTime(aliceWindow1, i);
      timesArray.push(timeMs);
    }
    console.log(timesArray);
  },
);
