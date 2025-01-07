import { englishStrippedStr } from '../locale/localizedString';
import { sleepFor } from '../promise_utils';
import { test_Alice_1W_Bob_1W } from './setup/sessionTest';
import { DMTimeOption, MediaType } from './types/testing';
import { createContact } from './utilities/create_contact';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
  trustUser,
} from './utilities/send_media';
import { setDisappearingMessages } from './utilities/set_disappearing_messages';
import {
  clickOnElement,
  clickOnTestIdWithText,
  hasElementBeenDeleted,
  hasTextMessageBeenDeleted,
  typeIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';
import { longText } from './constants/variables';
import { waitForSentTick } from './utilities/message';
import { joinCommunity } from './utilities/join_community';
import { testCommunityName } from './constants/community';

// Disappearing time settings for all tests
const timeOption: DMTimeOption = 'time-option-30-seconds';
const disappearingMessageType = 'disappear-after-send-option';
const disappearAction = 'sent';

[
  {
    mediaType: 'image',
    path: 'fixtures/test-image.png',
    attachmentType: 'media',
  },
  {
    mediaType: 'video',
    path: 'fixtures/test-video.mp4',
    attachmentType: 'media',
  },
  {
    mediaType: 'gif',
    path: 'fixtures/test-gif.gif',
    attachmentType: 'media',
  },
  {
    mediaType: 'document',
    path: 'fixtures/test-file.pdf',
    attachmentType: 'file',
  },
  {
    mediaType: 'voice',
    path: '',
    attachmentType: 'audio',
  },
].forEach(({ mediaType, path, attachmentType }) => {
  test_Alice_1W_Bob_1W(
    `Send disappearing ${mediaType} 1:1`,
    async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
      const testMessage = `${alice.userName} sending disappearing ${mediaType} to ${bob.userName}`;
      await createContact(aliceWindow1, bobWindow1, alice, bob);
      // Set disappearing messages
      await setDisappearingMessages(
        aliceWindow1,
        ['1:1', disappearingMessageType, timeOption, disappearAction],
        bobWindow1,
      );
      await Promise.all([
        waitForTestIdWithText(
          aliceWindow1,
          'disappear-control-message',
          englishStrippedStr('disappearingMessagesSetYou')
            .withArgs({
              time: '30 seconds',
              disappearing_messages_type: disappearAction,
            })
            .toString(),
        ),
        waitForTestIdWithText(
          bobWindow1,
          'disappear-control-message',
          englishStrippedStr('disappearingMessagesSet')
            .withArgs({
              time: '30 seconds',
              disappearing_messages_type: disappearAction,
              name: alice.userName,
            })
            .toString(),
        ),
      ]);
      // Send media
      if (mediaType === 'voice') {
        await sendVoiceMessage(aliceWindow1);
      } else {
        await sendMedia(aliceWindow1, path, testMessage);
      }
      // Click on untrusted attachment
      await trustUser(bobWindow1, alice.userName, attachmentType as MediaType);

      await waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation');
      if (mediaType === 'voice') {
        await waitForTestIdWithText(bobWindow1, 'audio-player');
        await sleepFor(30000);
        await hasElementBeenDeleted(bobWindow1, 'data-testid', 'audio-player');
      } else {
        await waitForTextMessage(bobWindow1, testMessage);
        // Wait 30 seconds for image to disappear
        await sleepFor(30000);
        await hasTextMessageBeenDeleted(bobWindow1, testMessage);
      }
    },
  );
});

test_Alice_1W_Bob_1W(
  `Send disappearing long text 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessageType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        'disappear-control-message',
        englishStrippedStr('disappearingMessagesSetYou')
          .withArgs({
            time: '30 seconds',
            disappearing_messages_type: disappearAction,
          })
          .toString(),
      ),
      waitForTestIdWithText(
        bobWindow1,
        'disappear-control-message',
        englishStrippedStr('disappearingMessagesSet')
          .withArgs({
            time: '30 seconds',
            disappearing_messages_type: disappearAction,
            name: alice.userName,
          })
          .toString(),
      ),
    ]);
    await typeIntoInput(aliceWindow1, 'message-input-text-area', longText);
    await sleepFor(100);
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'send-message-button',
    });
    await waitForSentTick(aliceWindow1, longText);
    await waitForTextMessage(bobWindow1, longText);
    // Wait 30 seconds for long text to disappear
    await sleepFor(30000);
    await hasTextMessageBeenDeleted(bobWindow1, longText);
  },
);

test_Alice_1W_Bob_1W(
  `Send disappearing link preview 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testLink = 'https://getsession.org/';
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessageType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        'disappear-control-message',
        englishStrippedStr('disappearingMessagesSetYou')
          .withArgs({
            time: '30 seconds',
            disappearing_messages_type: disappearAction,
          })
          .toString(),
      ),
      waitForTestIdWithText(
        bobWindow1,
        'disappear-control-message',
        englishStrippedStr('disappearingMessagesSet')
          .withArgs({
            time: '30 seconds',
            disappearing_messages_type: disappearAction,
            name: alice.userName,
          })
          .toString(),
      ),
    ]);
    await sendLinkPreview(aliceWindow1, testLink);
    await waitForElement(
      bobWindow1,
      'class',
      'module-message__link-preview__title',
      undefined,
      'Session | Send Messages, Not Metadata. | Private Messenger',
    );
    // Wait 30 seconds for link preview to disappear
    await sleepFor(30000);
    await hasElementBeenDeleted(
      bobWindow1,
      'class',
      'module-message__link-preview__title',
      undefined,
      'Session | Send Messages, Not Metadata. | Private Messenger',
    );
  },
);

test_Alice_1W_Bob_1W(
  `Send disappearing community invite 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessageType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        'disappear-control-message',
        englishStrippedStr('disappearingMessagesSetYou')
          .withArgs({
            time: '30 seconds',
            disappearing_messages_type: disappearAction,
          })
          .toString(),
      ),
      waitForTestIdWithText(
        bobWindow1,
        'disappear-control-message',
        englishStrippedStr('disappearingMessagesSet')
          .withArgs({
            time: '30 seconds',
            disappearing_messages_type: disappearAction,
            name: alice.userName,
          })
          .toString(),
      ),
    ]);
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
    // Wait 30 seconds for community invite to disappear
    await sleepFor(30000);
    await Promise.all([
      hasElementBeenDeleted(
        bobWindow1,
        'class',
        'group-name',
        undefined,
        testCommunityName,
      ),
      hasElementBeenDeleted(
        aliceWindow1,
        'class',
        'group-name',
        undefined,
        testCommunityName,
      ),
    ]);
  },
);
