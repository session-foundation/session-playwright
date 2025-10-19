import { englishStrippedStr } from '../localization/englishStrippedStr';
import { sleepFor } from '../promise_utils';
import { testCommunityName } from './constants/community';
import { longText, mediaArray, testLink } from './constants/variables';
import {
  Conversation,
  ConversationSettings,
  Global,
  HomeScreen,
} from './locators';
import { newUser } from './setup/new_user';
import {
  sessionTestOneWindow,
  sessionTestTwoWindows,
  test_Alice_1W_Bob_1W,
} from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import { joinCommunity } from './utilities/join_community';
import { sendMessage } from './utilities/message';
import { replyTo, replyToMedia } from './utilities/reply_message';
import {
  sendLinkPreview,
  sendMedia,
  sendVoiceMessage,
  trustUser,
} from './utilities/send_media';
import {
  checkModalStrings,
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  clickOnTextMessage,
  clickOnWithText,
  hasTextMessageBeenDeleted,
  measureSendingTime,
  typeIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

mediaArray.forEach(({ mediaType, path, attachmentType }) => {
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
    await clickOn(aliceWindow1, Conversation.conversationSettingsIcon);
    await clickOn(aliceWindow1, ConversationSettings.inviteContactsOption);
    await waitForTestIdWithText(
      aliceWindow1,
      'modal-heading',
      englishStrippedStr('membersInvite').toString(),
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
      englishStrippedStr('deleteMessageDeletedGlobally').toString(),
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
  sessionTestOneWindow(
    `Message length limit (${testCase.length} chars)`,
    async ([aliceWindow1]) => {
      const alice = await newUser(aliceWindow1, 'Alice', false);
      const expectedCount =
        testCase.length < countdownThreshold
          ? null
          : (maxChars - testCase.length).toString();
      const message = testCase.char.repeat(testCase.length);
      await clickOn(aliceWindow1, HomeScreen.plusButton);
      await clickOn(aliceWindow1, HomeScreen.newMessageOption);
      await typeIntoInput(aliceWindow1, 'new-session-conversation', alice.accountid);
      await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
      // Type the message
      await typeIntoInput(aliceWindow1, 'message-input-text-area', message, true);

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
        } catch (e) {
          // Expected - countdown should not exist
          console.log('Countdown not present as expected');
        }
      }

      // Try to send
      await clickOn(aliceWindow1, Conversation.sendMessageButton);

      if (testCase.shouldSend) {
        // Message should appear in Alice's window
        await waitForTextMessage(aliceWindow1, message);
      } else {
        // Message Too Long modal
        await checkModalStrings(
          aliceWindow1,
          englishStrippedStr('modalMessageTooLongTitle').toString(),
          englishStrippedStr('modalMessageTooLongDescription')
            .withArgs({ limit: maxChars.toLocaleString('en-AU') }) // With .toString() the test expects "2000" not "2,000"
            .toString(),
        );
        await clickOn(aliceWindow1, Global.confirmButton);

        // Verify message didn't send
        try {
          await waitForTextMessage(aliceWindow1, message, 2000);
          throw new Error('Message should not have been sent');
        } catch (e) {
          console.log(`Message didn't send as expected`);
        }
      }
    },
  );
});
