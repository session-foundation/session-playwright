import { tStripped } from '../localization/lib';
import { sleepFor } from '../promise_utils';
import { testCommunityName } from './constants/community';
import {
  longText,
  mediaArray,
  testLink,
  testLinkTitle,
} from './constants/variables';
import {
  Conversation,
  ConversationSettings,
  CTA,
  Global,
  HomeScreen,
} from './locators';
import { newUser } from './setup/new_user';
import {
  sessionTestTwoWindows,
  test_Alice_1W,
  test_Alice_1W_Bob_1W,
  test_Alice_2W,
  test_Alice_2W_Bob_1W,
} from './setup/sessionTest';
import { openConversationWith } from './utilities/conversation';
import { createContact } from './utilities/create_contact';
import { joinCommunity } from './utilities/join_community';
import {
  confirmMessageDeletedFor,
  deleteMessageFor,
  sendMessage,
} from './utilities/message';
import { replyTo, replyToMedia } from './utilities/reply_message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
  trustUser,
} from './utilities/send_media';
import {
  checkCTAStrings,
  checkModalStrings,
  clickOn,
  clickOnElement,
  clickOnWithText,
  hasElementPoppedUpThatShouldnt,
  measureSendingTime,
  pasteIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

mediaArray.forEach(
  ({ mediaType, path, attachmentType, shouldCheckMediaPreview }) => {
    test_Alice_1W_Bob_1W(
      `Send ${mediaType} 1:1`,
      async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
        const testMessage = `${alice.userName} sending ${mediaType} to ${bob.userName}`;
        const testReply = `${bob.userName} replying to ${mediaType} from ${alice.userName}`;
        await createContact(aliceWindow1, bobWindow1, alice, bob);
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
        // Click on untrusted attachment in window B
        await sleepFor(1000);
        await trustUser(bobWindow1, attachmentType, alice.userName);
        await waitForLoadingAnimationToFinish(bobWindow1, 'loading-animation');
        // Waiting for image to change from loading state to loaded (takes a second)
        await sleepFor(1000);
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
      },
    );
  },
);

test_Alice_1W_Bob_1W(
  'Send long text 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testReply = `${bob.userName} replying to long text message from ${alice.userName}`;
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await pasteIntoInput(aliceWindow1, 'message-input-text-area', longText);
    await sleepFor(100);
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'send-message-button',
    });
    // await waitForSentTick(aliceWindow1, longText);
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
  'Send link preview 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testReply = `${bob.userName} replying to link from ${alice.userName}`;

    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendLinkPreview(aliceWindow1, testLink);
    await waitForElement({
      window: bobWindow1,
      locator: Conversation.linkPreviewTitle,
      options: {
        maxWaitMs: 3_000,
        shouldLog: true,
        text: testLinkTitle,
      },
    });
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
      .getByTestId(Global.modalCloseButton.selector)
      .click();
    // Close UCS modal
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
  },
);

const delete1o1TypeArray = ['device_only', 'for_everyone'] as const;

delete1o1TypeArray.forEach((deleteType) => {
  test_Alice_2W_Bob_1W(
    `Delete message 1:1 ${deleteType}`,
    async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
      const messageToDelete = `Testing deletion functionality for ${deleteType}`;
      await createContact(aliceWindow1, bobWindow1, alice, bob);
      await sendMessage(aliceWindow1, messageToDelete);
      // Navigate to conversation on linked device and for message from user A to user B
      await openConversationWith(aliceWindow2, bob.userName);

      await Promise.all([
        waitForTextMessage(aliceWindow2, messageToDelete, 15_000),
        waitForTextMessage(bobWindow1, messageToDelete, 15_000),
      ]);
      await openConversationWith(aliceWindow2, bob.userName);

      await deleteMessageFor(aliceWindow1, messageToDelete, deleteType);

      await confirmMessageDeletedFor({
        deleteType,
        messageToDelete,
        otherWindows: [aliceWindow2, bobWindow1],
        windowInitiatingDelete: aliceWindow1,
      });

      if (deleteType === 'device_only') {
        // when testing the device_only deletion, we also want to check that
        // an incoming message can be deleted locally.
        const messageToDelete2 = `Testing deletion functionality for ${deleteType} #2`;

        await sendMessage(aliceWindow1, messageToDelete2);
        await waitForTextMessage(
          [aliceWindow2, bobWindow1],
          messageToDelete2,
          15_000,
        );

        // bob now deletes Alice's message locally
        await deleteMessageFor(bobWindow1, messageToDelete2, deleteType);

        await confirmMessageDeletedFor({
          deleteType,
          messageToDelete: messageToDelete2,
          otherWindows: [aliceWindow1, aliceWindow2],
          windowInitiatingDelete: bobWindow1,
        });
      }
    },
  );
});

const deleteNtsTypeArray = ['device_only', 'for_all_my_devices'] as const;

deleteNtsTypeArray.forEach((deleteType) => {
  test_Alice_2W(
    `Delete message NTS ${deleteType}`,
    async ({ aliceWindow1, aliceWindow2 }) => {
      const messageToDelete = `Testing deletion functionality for NTS ${deleteType}`;
      await sendMessage(aliceWindow1, messageToDelete);
      // Navigate to conversation on linked device
      await openConversationWith(aliceWindow2, tStripped('noteToSelf'));
      await Promise.all([
        waitForTextMessage(aliceWindow1, messageToDelete, 15_000),
        waitForTextMessage(aliceWindow2, messageToDelete, 15_000),
      ]);

      await deleteMessageFor(aliceWindow1, messageToDelete, deleteType);

      await confirmMessageDeletedFor({
        deleteType,
        messageToDelete,
        otherWindows: [aliceWindow2],
        windowInitiatingDelete: aliceWindow1,
      });
    },
  );
});

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
      const timeMs = await measureSendingTime(aliceWindow1, i);
      timesArray.push(timeMs);
    }
    console.log(timesArray);
  },
);

// Message length limit tests (pre-pro)
const maxChars = 2000;
const countdownThreshold = 1800;

const messageLengthTestCases = [
  {
    length: 1799,
    char: 'a',
    shouldSend: true,
  },
  {
    length: 1800,
    char: 'b',
    shouldSend: true,
  },
  {
    length: 2000,
    char: 'c',
    shouldSend: true,
  },
  {
    length: 2001,
    char: 'd',
    shouldSend: false,
  },
];

messageLengthTestCases.forEach((testCase) => {
  test_Alice_1W_Bob_1W(
    `Message length limit (${testCase.length} chars)`,
    async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
      await createContact(aliceWindow1, bobWindow1, alice, bob);
      const expectedCount =
        testCase.length < countdownThreshold
          ? null
          : (maxChars - testCase.length).toString();
      const message = testCase.char.repeat(testCase.length);
      // Type the message
      await pasteIntoInput(aliceWindow1, 'message-input-text-area', message);

      // Check countdown behavior
      if (expectedCount) {
        await waitForElement({
          window: aliceWindow1,
          locator: Conversation.tooltipCharacterCount,
          options: { text: expectedCount },
        });
      } else {
        // Verify countdown tooltip is not present
        try {
          await waitForElement({
            window: aliceWindow1,
            locator: Conversation.tooltipCharacterCount,
            options: {
              maxWaitMs: 1_000,
              shouldLog: true,
            },
          });
          throw new Error(
            `Countdown should not be visible for messages under ${countdownThreshold} chars`,
          );
        } catch (_e) {
          // Expected - countdown should not exist
          console.log('Countdown not present as expected');
        }
      }

      // Try to send
      await clickOn(aliceWindow1, Conversation.sendMessageButton);

      if (testCase.shouldSend) {
        // Message should appear in Alice's window
        await Promise.all(
          [aliceWindow1, bobWindow1].map(async (w) => {
            await waitForTextMessage(w, message);
          }),
        );
      } else {
        if (process.env.SESSION_PRO) {
          console.log('Session Pro detected, checking CTA');
          // Upgrade to pro
          await checkCTAStrings(
            aliceWindow1,
            tStripped('upgradeTo'),
            tStripped('proCallToActionLongerMessages'),
            [tStripped('theContinue'), tStripped('cancel')],
            [
              ` ${tStripped('proFeatureListLongerMessages')}`,
              ` ${tStripped('proFeatureListPinnedConversations')}`,
              tStripped('proFeatureListLoadsMore'),
            ],
          );
          await clickOn(aliceWindow1, CTA.cancelButton);
        } else {
          console.log('Session Pro not detected, checking modal');
          // Message Too Long modal
          await checkModalStrings(
            aliceWindow1,
            tStripped('modalMessageTooLongTitle'),
            tStripped('modalMessageTooLongDescription', {
              limit: maxChars.toLocaleString('en-AU'),
            }), // Force "2,000" instead of "2000"
          );
          await clickOn(aliceWindow1, Global.confirmButton);
        }

        // Verify message didn't send
        try {
          await waitForTextMessage(aliceWindow1, message, 2000);
          throw new Error('Message should not have been sent');
        } catch (_e) {
          console.log(`Message didn't send as expected`);
        }
      }
    },
  );
});

test_Alice_1W(
  'Emoji does not show for links',
  async ({ aliceWindow1, alice }) => {
    await clickOn(aliceWindow1, HomeScreen.plusButton);
    await clickOn(aliceWindow1, HomeScreen.newMessageOption);
    await pasteIntoInput(
      aliceWindow1,
      HomeScreen.newMessageAccountIDInput.selector,
      alice.accountid,
    );
    await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
    await pasteIntoInput(
      aliceWindow1,
      Conversation.messageInput.selector,
      ':a',
    );
    await waitForTestIdWithText(
      aliceWindow1,
      Conversation.mentionsContainer.selector,
    );
    await waitForTestIdWithText(
      aliceWindow1,
      Conversation.mentionsItem.selector,
      ':a:',
    );
    await pasteIntoInput(
      aliceWindow1,
      Conversation.messageInput.selector,
      'https:/',
    );
    await hasElementPoppedUpThatShouldnt(
      aliceWindow1,
      Conversation.mentionsContainer.strategy,
      Conversation.mentionsContainer.selector,
    );
    await pasteIntoInput(
      aliceWindow1,
      Conversation.messageInput.selector,
      'check this out https:/',
    );
    await hasElementPoppedUpThatShouldnt(
      aliceWindow1,
      Conversation.mentionsContainer.strategy,
      Conversation.mentionsContainer.selector,
    );
  },
);

test_Alice_1W(
  'Emoji closes when clicking away',
  async ({ aliceWindow1, alice }) => {
    await clickOn(aliceWindow1, HomeScreen.plusButton);
    await clickOn(aliceWindow1, HomeScreen.newMessageOption);
    await pasteIntoInput(
      aliceWindow1,
      HomeScreen.newMessageAccountIDInput.selector,
      alice.accountid,
    );
    await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
    await pasteIntoInput(
      aliceWindow1,
      Conversation.messageInput.selector,
      'hey check this out :a',
    );
    await waitForTestIdWithText(
      aliceWindow1,
      Conversation.mentionsContainer.selector,
    );
    await waitForTestIdWithText(
      aliceWindow1,
      Conversation.mentionsItem.selector,
      ':a:',
    );
    await clickOn(aliceWindow1, Conversation.messageInput);
    await hasElementPoppedUpThatShouldnt(
      aliceWindow1,
      Conversation.mentionsContainer.strategy,
      Conversation.mentionsContainer.selector,
    );
  },
);
