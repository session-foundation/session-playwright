import { tStripped } from '../localization/lib';
import { sleepFor } from '../promise_utils';
import { testCommunityName } from './constants/community';
import {
  defaultDisappearingOptions,
  longText,
  mediaArray,
  testLink,
  testLinkTitle,
} from './constants/variables';
import { Conversation, ConversationSettings, Global } from './locators';
import { test_Alice_1W_Bob_1W } from './setup/sessionTest';
import { openConversationWith } from './utilities/conversation';
import { createContact } from './utilities/create_contact';
import { joinCommunity } from './utilities/join_community';
import { waitForMessageStatus } from './utilities/message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
  trustUser,
} from './utilities/send_media';
import { setDisappearingMessages } from './utilities/set_disappearing_messages';
import {
  clickOn,
  clickOnWithText,
  formatTimeOption,
  hasElementBeenDeleted,
  hasTextMessageBeenDeleted,
  pasteIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';
import { makeVoiceCall } from './utilities/voice_call';

// Disappearing time settings for all tests
const { timeOption, disappearingMessagesType, disappearAction } =
  defaultDisappearingOptions.DAS;

mediaArray.forEach(
  ({ mediaType, path, attachmentType, shouldCheckMediaPreview }) => {
    test_Alice_1W_Bob_1W(
      `Send disappearing ${mediaType} 1:1`,
      async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
        const testMessage = `${alice.userName} sending disappearing ${mediaType} to ${bob.userName}`;
        const formattedTime = formatTimeOption(timeOption);
        await createContact(aliceWindow1, bobWindow1, alice, bob);
        // Set disappearing messages
        await setDisappearingMessages(
          aliceWindow1,
          ['1:1', disappearingMessagesType, timeOption, disappearAction],
          bobWindow1,
        );
        await Promise.all([
          waitForTestIdWithText(
            aliceWindow1,
            Conversation.disappearingControlMessage.selector,
            tStripped('disappearingMessagesSetYou', {
              time: formattedTime,
              disappearing_messages_type: disappearAction,
            }),
          ),
          waitForTestIdWithText(
            bobWindow1,
            Conversation.disappearingControlMessage.selector,
            tStripped('disappearingMessagesSet', {
              time: formattedTime,
              disappearing_messages_type: disappearAction,
              name: alice.userName,
            }),
          ),
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
        // Click on untrusted attachment
        await trustUser(bobWindow1, attachmentType, alice.userName);

        await waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation');
        if (mediaType === 'voice') {
          await waitForTestIdWithText(bobWindow1, 'audio-player');
          await sleepFor(30000);
          await hasElementBeenDeleted(bobWindow1, Conversation.audioPlayer, {
            maxWait: 1_000,
          });
        } else {
          await waitForTextMessage(bobWindow1, testMessage);
          // Wait 30 seconds for image to disappear
          await sleepFor(30000);
          await hasTextMessageBeenDeleted(bobWindow1, testMessage);
        }
      },
    );
  },
);

test_Alice_1W_Bob_1W(
  `Send disappearing long text 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const formattedTime = formatTimeOption(timeOption);
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessagesType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSetYou', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
        }),
      ),
      waitForTestIdWithText(
        bobWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSet', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
          name: alice.userName,
        }),
      ),
    ]);
    await pasteIntoInput(aliceWindow1, 'message-input-text-area', longText);
    await sleepFor(100);
    await clickOn(aliceWindow1, Conversation.sendMessageButton);
    await waitForMessageStatus(aliceWindow1, longText, 'sent');
    await waitForTextMessage(bobWindow1, longText);
    // Wait 30 seconds for long text to disappear
    await sleepFor(30000);
    await hasTextMessageBeenDeleted(bobWindow1, longText);
  },
);

test_Alice_1W_Bob_1W(
  `Send disappearing link preview 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const formattedTime = formatTimeOption(timeOption);
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessagesType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSetYou', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
        }),
      ),
      waitForTestIdWithText(
        bobWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSet', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
          name: alice.userName,
        }),
      ),
    ]);
    await sendLinkPreview(aliceWindow1, testLink);
    await waitForElement({
      window: bobWindow1,
      locator: Conversation.linkPreviewTitle,
      options: {
        maxWaitMs: 10_000,
        shouldLog: true,
        text: testLinkTitle,
      },
    });
    // Wait 30 seconds for link preview to disappear
    await sleepFor(30_000);
    await hasElementBeenDeleted(bobWindow1, Conversation.linkPreviewTitle, {
      maxWait: 1_000, // no need to wait too long here, it should have disappeared already
      text: testLinkTitle,
    });
  },
);

test_Alice_1W_Bob_1W(
  `Send disappearing community invite 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const formattedTime = formatTimeOption(timeOption);
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessagesType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSetYou', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
        }),
      ),
      waitForTestIdWithText(
        bobWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSet', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
          name: alice.userName,
        }),
      ),
    ]);
    await joinCommunity(aliceWindow1);
    // To stop the layout shift
    await sleepFor(500);
    await clickOn(aliceWindow1, Conversation.conversationSettingsIcon);
    await clickOn(aliceWindow1, ConversationSettings.inviteContactsOption);
    await waitForTestIdWithText(
      aliceWindow1,
      'modal-heading',
      tStripped('membersInvite'),
    );
    await clickOnWithText(aliceWindow1, Global.contactItem, bob.userName);
    await clickOn(aliceWindow1, Global.confirmButton);
    // For lack of a unique ID we use native Playwright methods
    await aliceWindow1
      .getByTestId('invite-contacts-dialog')
      .getByTestId('modal-close-button')
      .click();
    await clickOn(aliceWindow1, Global.modalCloseButton);

    await openConversationWith(aliceWindow1, bob.userName);
    await Promise.all(
      [aliceWindow1, bobWindow1].map((w) =>
        waitForElement({
          window: w,
          locator: Conversation.communityInvitationDetails,
          options: {
            maxWaitMs: 15_000,
            shouldLog: true,
            text: testCommunityName,
          },
        }),
      ),
    );
    // Wait 30 seconds for community invite to disappear
    await sleepFor(30000);
    await Promise.all(
      [bobWindow1, aliceWindow1].map((w) =>
        hasElementBeenDeleted(w, Conversation.communityInvitationDetails, {
          maxWait: 1_000,
          text: testCommunityName,
        }),
      ),
    );
  },
);

test_Alice_1W_Bob_1W(
  `Send disappearing call message 1:1`,
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const formattedTime = formatTimeOption(timeOption);
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Set disappearing messages
    await setDisappearingMessages(
      aliceWindow1,
      ['1:1', disappearingMessagesType, timeOption, disappearAction],
      bobWindow1,
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSetYou', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
        }),
      ),
      waitForTestIdWithText(
        bobWindow1,
        Conversation.disappearingControlMessage.selector,
        tStripped('disappearingMessagesSet', {
          time: formattedTime,
          disappearing_messages_type: disappearAction,
          name: alice.userName,
        }),
      ),
    ]);
    await makeVoiceCall(aliceWindow1, bobWindow1);
    // In the receivers window, the message is 'Call in progress'
    await Promise.all([
      waitForElement({
        window: bobWindow1,
        locator: Conversation.callNotificationAnswered,
        options: {
          text: tStripped('callsInProgress'),
          shouldLog: true,
          maxWaitMs: 15_000,
        },
      }),
      // In the callers window, the message is 'You called {receiverName}'
      waitForTestIdWithText(
        aliceWindow1,
        'call-notification-started-call',
        tStripped('callsYouCalled', { name: bob.userName }),
      ),
    ]);
    // Wait 30 seconds for call message to disappear
    await sleepFor(30000);

    await Promise.all([
      hasElementBeenDeleted(bobWindow1, Conversation.callNotificationAnswered, {
        maxWait: 1_000,
        text: tStripped('callsInProgress'),
      }),
      hasElementBeenDeleted(
        aliceWindow1,
        Conversation.callNotificationStarted,
        {
          maxWait: 1_000,
          text: tStripped('callsYouCalled', { name: bob.userName }),
        },
      ),
    ]);
  },
);
