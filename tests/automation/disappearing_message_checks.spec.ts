import { englishStrippedStr } from '../locale/localizedString';
import { sleepFor } from '../promise_utils';
import { test_Alice_1W_Bob_1W } from './setup/sessionTest';
import { DMTimeOption } from './types/testing';
import { createContact } from './utilities/create_contact';
import { sendImage, sendMedia, sendVideo } from './utilities/send_media';
import { setDisappearingMessages } from './utilities/set_disappearing_messages';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
  hasElementBeenDeleted,
  hasTextMessageBeenDeleted,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

[
  {
    mediaType: 'image',
    path: 'fixtures/test-image.png',
  },
  {
    mediaType: 'video',
    path: 'fixtures/test-video.mp4',
  },
  {
    mediaType: 'gif',
    path: 'fixtures/test-gif.gif',
  },
  {
    mediaType: 'document',
    path: 'fixtures/test-file.pdf',
  },
].forEach(({ mediaType, path }) => {
  test_Alice_1W_Bob_1W(
    `Send disappearing ${mediaType} 1:1`,
    async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
      const testMessage = `${alice.userName} sending disappearing ${mediaType} to ${bob.userName}`;
      const timeOption: DMTimeOption = 'time-option-30-seconds';
      const disappearingMessageType = 'disappear-after-send-option';
      await createContact(aliceWindow1, bobWindow1, alice, bob);
      // Set disappearing messages
      await setDisappearingMessages(
        aliceWindow1,
        ['1:1', disappearingMessageType, timeOption],
        bobWindow1,
      );
      await Promise.all([
        waitForTestIdWithText(
          aliceWindow1,
          'disappear-control-message',
          englishStrippedStr('disappearingMessagesSetYou')
            .withArgs({
              time: '30 seconds',
              disappearing_messages_type: 'sent',
            })
            .toString(),
        ),
        waitForTestIdWithText(
          bobWindow1,
          'disappear-control-message',
          englishStrippedStr('disappearingMessagesSet')
            .withArgs({
              time: '30 seconds',
              disappearing_messages_type: 'sent',
              name: alice.userName,
            })
            .toString(),
        ),
      ]);
      // Send media
      await sendMedia(aliceWindow1, path, testMessage);
      // Click on untrusted attachment
      await clickOnMatchingText(
        bobWindow1,
        englishStrippedStr('attachmentsClickToDownload')
          .withArgs({
            file_type: englishStrippedStr('media').toString().toLowerCase(),
          })
          .toString(),
      );
      // Need modal-description test tag
      // await checkModalStrings(
      //   bobWindow1,
      //   englishStrippedStr('attachmentsAutoDownloadModalTitle').toString(),
      //   englishStrippedStr('attachmentsAutoDownloadModalDescription')
      //     .withArgs({
      //       conversation_name: alice.userName,
      //     })
      //     .toString(),
      // );
      await clickOnTestIdWithText(
        bobWindow1,
        'session-confirm-ok-button',
        englishStrippedStr('download').toString(),
      );
      await waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation');
      await Promise.all([
        waitForTextMessage(bobWindow1, testMessage),
        waitForElement(bobWindow1, 'class', 'module-image__image'),
      ]);
      // Wait 10 seconds for image to disappear
      await sleepFor(30000);
      await Promise.all([
        hasTextMessageBeenDeleted(bobWindow1, testMessage),
        hasElementBeenDeleted(bobWindow1, 'class', 'module-image__image', 1000),
      ]);
    },
  );
});
