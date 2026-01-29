import { sleepFor } from '../promise_utils';
import {
  defaultDisappearingOptions,
  longText,
  mediaArray,
  testLink,
} from './constants/variables';
import { test_group_Alice1_Bob1_Charlie1 } from './setup/sessionTest';
import { sendMessage } from './utilities/message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
} from './utilities/send_media';
import { setDisappearingMessages } from './utilities/set_disappearing_messages';
import {
  hasElementBeenDeleted,
  hasTextMessageBeenDeleted,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

// Disappearing time settings for all tests
const { timeOption, disappearingMessagesType, disappearAction } =
  defaultDisappearingOptions.group;

mediaArray.forEach(({ mediaType, path, shouldCheckMediaPreview }) => {
  test_group_Alice1_Bob1_Charlie1(
    `Send disappearing ${mediaType} groups`,
    async ({
      alice,
      aliceWindow1,
      bobWindow1,
      charlieWindow1,
      groupCreated,
    }) => {
      const testMessage = `${alice.userName} sending ${mediaType} to ${groupCreated.userName}`;
      await setDisappearingMessages(aliceWindow1, [
        'group',
        disappearingMessagesType,
        timeOption,
        disappearAction,
      ]);
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
      if (mediaType === 'voice') {
        await Promise.all([
          waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation'),
          waitForLoadingAnimationToFinish(charlieWindow1, 'loading-animation'),
          waitForTestIdWithText(bobWindow1, 'audio-player'),
          waitForTestIdWithText(charlieWindow1, 'audio-player'),
        ]);
        await sleepFor(10000);
        await Promise.all([
          hasElementBeenDeleted(bobWindow1, 'data-testid', 'audio-player'),
          hasElementBeenDeleted(charlieWindow1, 'data-testid', 'audio-player'),
        ]);
      } else {
        await Promise.all([
          waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation'),
          waitForLoadingAnimationToFinish(charlieWindow1, 'loading-animation'),
          waitForTextMessage(bobWindow1, testMessage),
          waitForTextMessage(charlieWindow1, testMessage),
        ]);
        // Wait 10 seconds for image to disappear
        await sleepFor(10000);
        await Promise.all([
          hasTextMessageBeenDeleted(bobWindow1, testMessage),
          hasTextMessageBeenDeleted(charlieWindow1, testMessage),
        ]);
      }
    },
  );
});

test_group_Alice1_Bob1_Charlie1(
  'Send disappearing long text to groups',
  async ({ aliceWindow1, bobWindow1, charlieWindow1 }) => {
    await setDisappearingMessages(aliceWindow1, [
      'group',
      disappearingMessagesType,
      timeOption,
      disappearAction,
    ]);
    await sendMessage(aliceWindow1, longText);
    await Promise.all([
      waitForTextMessage(bobWindow1, longText),
      waitForTextMessage(charlieWindow1, longText),
    ]);
    await sleepFor(30000);
    await Promise.all([
      hasTextMessageBeenDeleted(bobWindow1, longText),
      hasTextMessageBeenDeleted(charlieWindow1, longText),
    ]);
  },
);

test_group_Alice1_Bob1_Charlie1(
  'Send disappearing link to groups',
  async ({ aliceWindow1, bobWindow1, charlieWindow1 }) => {
    await setDisappearingMessages(aliceWindow1, [
      'group',
      disappearingMessagesType,
      timeOption,
      disappearAction,
    ]);
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
    await sleepFor(30000);
    await Promise.all([
      hasElementBeenDeleted(
        bobWindow1,
        'class',
        'module-message__link-preview__title',
        undefined,
        'Session | Send Messages, Not Metadata. | Private Messenger',
      ),
      hasElementBeenDeleted(
        charlieWindow1,
        'class',
        'module-message__link-preview__title',
        undefined,
        'Session | Send Messages, Not Metadata. | Private Messenger',
      ),
    ]);
  },
);
