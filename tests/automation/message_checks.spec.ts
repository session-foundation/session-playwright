import { tStripped } from '../localization/lib';
import { sleepFor } from '../promise_utils';
import { testCommunityName } from './constants/community';
import { longText, mediaArray, testLink } from './constants/variables';
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
  test_Alice_2W_Bob_1W,
} from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import { joinCommunity } from './utilities/join_community';
import { deleteMessageFor, sendMessage } from './utilities/message';
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
  clickOnMatchingText,
  clickOnTextMessage,
  clickOnWithText,
  hasElementPoppedUpThatShouldnt,
  hasTextMessageBeenDeleted,
  measureSendingTime,
  pasteIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
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
  'Send link 1:1',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    const testReply = `${bob.userName} replying to link from ${alice.userName}`;

    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendLinkPreview(aliceWindow1, testLink);
    await waitForElement(
      bobWindow1,
      'data-testid',
      'msg-link-preview-title',
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
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
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
    await clickOnMatchingText(aliceWindow1, tStripped('delete'));
    await clickOnMatchingText(aliceWindow1, tStripped('deleteMessageEveryone'));
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'session-confirm-ok-button',
    });
    await waitForTestIdWithText(
      aliceWindow1,
      'session-toast',
      tStripped('deleteMessageDeleted', { count: 1 }),
    );
    await sleepFor(1000);
    await waitForMatchingText(
      bobWindow1,
      tStripped('deleteMessageDeletedGlobally'),
      15_000,
    );
  },
);

test_Alice_2W_Bob_1W(
  'Delete message locally in 1:1',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    // send a message from alice to Bob, and then try to delete it locally from Alice's side
    const deletedMessage1 = `Testing deletion functionality from ${alice.userName} to ${bob.userName} in 1:1 at ${new Date().toISOString()}`;
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendMessage(aliceWindow1, deletedMessage1);
    // focus the conversation on aliceWindow2 (not done as restored from seed)
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      bob.userName,
    );

    await Promise.all(
      [aliceWindow2, bobWindow1].map((w) =>
        waitForTextMessage(w, deletedMessage1),
      ),
    );
    await deleteMessageFor(aliceWindow1, deletedMessage1, 'device_only');
    await hasTextMessageBeenDeleted(aliceWindow1, deletedMessage1, 1_000);
    // Still should exist in Bob and aliceWindow2
    await Promise.all(
      [aliceWindow2, bobWindow1].map((w) =>
        waitForMatchingText(w, deletedMessage1, 15_000),
      ),
    );

    // same, but we know want validate that Bob can also delete locally Alice's message
    const deletedMessage2 = `Testing deletion functionality from ${alice.userName} to ${bob.userName} in 1:1 at ${new Date().toISOString()}`;
    await sendMessage(aliceWindow1, deletedMessage2); // alice sends it again
    await Promise.all(
      [aliceWindow2, bobWindow1].map((w) =>
        waitForTextMessage(w, deletedMessage2),
      ),
    );
    await deleteMessageFor(bobWindow1, deletedMessage2, 'device_only'); // Bob deletes Alice's message locally

    await hasTextMessageBeenDeleted(bobWindow1, deletedMessage2, 1_000);
    // Still should exist in Bob and aliceWindow2
    await Promise.all(
      [aliceWindow1, aliceWindow2].map((w) =>
        waitForMatchingText(w, deletedMessage2, 15_000),
      ),
    );
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
        await waitForTestIdWithText(
          aliceWindow1,
          'tooltip-character-count',
          expectedCount,
        );
      } else {
        // Verify countdown tooltip is not present
        try {
          await waitForElement(
            aliceWindow1,
            'data-testid',
            'tooltip-character-count',
            1000,
          );
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
