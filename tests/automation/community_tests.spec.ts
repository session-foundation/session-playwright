import { tStripped } from '../localization/lib';
import { testCommunityName } from './constants/community';
import { Conversation, Global, HomeScreen } from './locators';
import { newUser } from './setup/new_user';
import { recoverFromSeed } from './setup/recovery_using_seed';
import {
  sessionTestTwoWindows,
  test_Alice_1W_Bob_1W,
  test_Alice_2W,
} from './setup/sessionTest';
import {
  assertAdminIsKnown,
  joinCommunity,
  joinOrOpenCommunity,
} from './utilities/join_community';
import { sendMessage, waitForMessageStatus } from './utilities/message';
import { replyTo } from './utilities/reply_message';
import { sendMedia } from './utilities/send_media';
import {
  clickOn,
  clickOnWithText,
  hasElementBeenDeleted,
  hasElementPoppedUpThatShouldnt,
  pasteIntoInput,
  scrollToBottomIfNecessary,
  waitForTestIdWithText,
} from './utilities/utils';

const banUserString = tStripped('banUser');
const unbanUserString = tStripped('banUnbanUser');

test_Alice_2W(
  'Join community and sync',
  async ({ aliceWindow1, aliceWindow2 }) => {
    await joinCommunity(aliceWindow1);
    await scrollToBottomIfNecessary(aliceWindow1);
    await sendMessage(aliceWindow1, 'Hello, community!');
    // Check linked device for community
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      testCommunityName,
    );
  },
);

test_Alice_1W_Bob_1W(
  'Send image to community',
  async ({ alice, bob, aliceWindow1, bobWindow1 }) => {
    const mediaPath = 'sample_files/test-image.png';
    const testImageMessage = `Image message + ${Date.now()} + desktop`;
    const testReply = `${bob.userName} replying to image from ${alice.userName}`;
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    // await Promise.all([
    //   waitForLoadingAnimationToFinish(aliceWindow1, 'loading-spinner'),
    //   waitForLoadingAnimationToFinish(bobWindow1, 'loading-spinner'),
    // ]);
    await Promise.all(
      [aliceWindow1, bobWindow1].map((window) =>
        scrollToBottomIfNecessary(window),
      ),
    );
    await sendMedia(aliceWindow1, mediaPath, testImageMessage, true);
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: testImageMessage,
      replyText: testReply,
      receiverWindow: aliceWindow1,
      shouldCheckMediaPreview: true,
    });
  },
);

sessionTestTwoWindows('Ban and unban user', async ([windowA, windowB]) => {
  assertAdminIsKnown();
  const banMeUnbanLaterMsg = `Ban me but unban me later! - ${Date.now()}`;
  const bannedCheckMsg = `I'm banned :( - ${Date.now()}`;
  const msg3 = `Freedom! - ${Date.now()}`;
  await Promise.all([
    recoverFromSeed(windowA, process.env.SOGS_ADMIN_SEED!, {
      fallbackName: 'Admin',
    }),
    newUser(windowB, 'Bob'),
  ]);
  await Promise.all([joinOrOpenCommunity(windowA), joinCommunity(windowB)]);
  await sendMessage(windowB, banMeUnbanLaterMsg);
  await windowA.bringToFront();
  await scrollToBottomIfNecessary(windowA);
  await clickOnWithText(
    windowA,
    Conversation.messageContent,
    banMeUnbanLaterMsg,
    {
      rightButton: true,
      maxWait: 15_000,
    },
  );
  await clickOnWithText(windowA, Global.contextMenuItem, banUserString, {
    strictMode: false,
    maxWait: 10_000,
  });
  await clickOn(windowA, Conversation.banUserButton);
  await pasteIntoInput(
    windowB,
    Conversation.messageInput.selector,
    bannedCheckMsg,
  );
  await clickOn(windowB, Conversation.sendMessageButton);
  await waitForMessageStatus(windowB, bannedCheckMsg, 'failed');
  await clickOnWithText(
    windowA,
    Conversation.messageContent,
    banMeUnbanLaterMsg,
    {
      rightButton: true,
    },
  );
  await clickOnWithText(windowA, Global.contextMenuItem, unbanUserString, {
    strictMode: false,
  });
  await clickOn(windowA, Conversation.unbanUserButton);
  await sendMessage(windowB, msg3);
  await waitForTestIdWithText(
    windowA,
    Conversation.messageContent.selector,
    msg3,
  );

  // Now that the user is unban, check that we can ban and delete all.
  // Note: a single test is doing all of those steps because having two of them on the same seed turns out to make both unreliable
  const banAndDeleteAllMsg = `Ban and delete! - ${Date.now()}`;
  const bannedCheckMsg2 = `Did that work? - ${Date.now()}`;
  await sendMessage(windowB, banAndDeleteAllMsg);
  await windowA.bringToFront();
  await scrollToBottomIfNecessary(windowA);
  await clickOnWithText(
    windowA,
    Conversation.messageContent,
    banAndDeleteAllMsg,
    {
      rightButton: true,
      maxWait: 15_000,
    },
  );
  await clickOnWithText(windowA, Global.contextMenuItem, banUserString, {
    strictMode: false,
    maxWait: 10_000,
  });
  await clickOn(windowA, Conversation.banAndDeleteAllButton);
  await hasElementBeenDeleted(
    windowA,
    Conversation.messageContent.strategy,
    Conversation.messageContent.selector,
    10_000,
    banAndDeleteAllMsg,
  );
  await pasteIntoInput(
    windowB,
    Conversation.messageInput.selector,
    bannedCheckMsg2,
  );
  await clickOn(windowB, Conversation.sendMessageButton);
  await waitForMessageStatus(windowB, bannedCheckMsg2, 'failed');
  await hasElementPoppedUpThatShouldnt(
    windowA,
    Conversation.messageContent.strategy,
    Conversation.messageContent.selector,
    bannedCheckMsg2,
  );
});
