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
import { sendMessage, waitForFailedTick } from './utilities/message';
import { replyTo } from './utilities/reply_message';
import { sendMedia } from './utilities/send_media';
import {
  clickOn,
  clickOnWithText,
  hasElementBeenDeleted,
  hasElementPoppedUpThatShouldnt,
  typeIntoInput,
  waitForTestIdWithText,
} from './utilities/utils';

test_Alice_2W(
  'Join community and sync',
  async ({ aliceWindow1, aliceWindow2 }) => {
    await joinCommunity(aliceWindow1);
    await clickOn(aliceWindow1, Conversation.scrollToBottomButton);
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
        clickOn(window, Conversation.scrollToBottomButton),
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

sessionTestTwoWindows('Ban User', async ([windowA, windowB]) => {
  assertAdminIsKnown();
  const msg1 = `Ban me! - ${Date.now()}`;
  const msg2 = `Am I still here? - ${Date.now()}`;
  await Promise.all([
    recoverFromSeed(windowA, process.env.SOGS_ADMIN_SEED!, {
      fallbackName: 'Admin',
    }),
    newUser(windowB, 'Bob'),
  ]);
  await Promise.all([joinOrOpenCommunity(windowA), joinCommunity(windowB)]);
  await sendMessage(windowB, msg1);
  await clickOnWithText(windowA, Conversation.messageContent, msg1, {
    rightButton: true,
  });
  await windowA.bringToFront();
  await clickOnWithText(windowA, Global.contextMenuItem, 'Ban User', {
    strictMode: false,
  });
  await clickOn(windowA, Conversation.banUserButton);
  await typeIntoInput(windowB, Conversation.messageInput.selector, msg2);
  await clickOn(windowB, Conversation.sendMessageButton);
  await waitForFailedTick(windowB, msg2);
  await hasElementPoppedUpThatShouldnt(
    windowA,
    Conversation.messageContent.strategy,
    Conversation.messageContent.selector,
    msg2,
  );
});

sessionTestTwoWindows('Unban User', async ([windowA, windowB]) => {
  assertAdminIsKnown();
  const msg1 = `Ban me but unban me later! - ${Date.now()}`;
  const msg2 = `I'm banned :( - ${Date.now()}`;
  const msg3 = `Freedom! - ${Date.now()}`;
  await Promise.all([
    recoverFromSeed(windowA, process.env.SOGS_ADMIN_SEED!, {
      fallbackName: 'Admin',
    }),
    newUser(windowB, 'Bob'),
  ]);
  await Promise.all([joinOrOpenCommunity(windowA), joinCommunity(windowB)]);
  await sendMessage(windowB, msg1);
  await clickOnWithText(windowA, Conversation.messageContent, msg1, {
    rightButton: true,
  });
  await clickOnWithText(windowA, Global.contextMenuItem, 'Ban User', {
    strictMode: false,
  });
  await clickOn(windowA, Conversation.banUserButton);
  await typeIntoInput(windowB, Conversation.messageInput.selector, msg2);
  await clickOn(windowB, Conversation.sendMessageButton);
  await waitForFailedTick(windowB, msg2);
  await clickOnWithText(windowA, Conversation.messageContent, msg1, {
    rightButton: true,
  });
  await clickOnWithText(windowA, Global.contextMenuItem, 'Unban User', {
    strictMode: false,
  });
  await clickOn(windowA, Conversation.unbanUserButton);
  await sendMessage(windowB, msg3);
  await waitForTestIdWithText(
    windowA,
    Conversation.messageContent.selector,
    msg3,
  );
});

sessionTestTwoWindows('Ban And Delete All', async ([windowA, windowB]) => {
  assertAdminIsKnown();
  const msg1 = `Ban and delete! - ${Date.now()}`;
  const msg2 = `Did that work? - ${Date.now()}`;
  await Promise.all([
    recoverFromSeed(windowA, process.env.SOGS_ADMIN_SEED!, {
      fallbackName: 'Admin',
    }),
    newUser(windowB, 'Bob'),
  ]);
  await Promise.all([joinOrOpenCommunity(windowA), joinCommunity(windowB)]);
  await sendMessage(windowB, msg1);
  await clickOnWithText(windowA, Conversation.messageContent, msg1, {
    rightButton: true,
  });
  await clickOnWithText(windowA, Global.contextMenuItem, 'Ban User', {
    strictMode: false,
  });
  await clickOn(windowA, Conversation.banAndDeleteAllButton);
  await hasElementBeenDeleted(
    windowA,
    Conversation.messageContent.strategy,
    Conversation.messageContent.selector,
    10_000,
    msg1,
  );
  await typeIntoInput(windowB, Conversation.messageInput.selector, msg2);
  await clickOn(windowB, Conversation.sendMessageButton);
  await waitForFailedTick(windowB, msg2);
  await hasElementPoppedUpThatShouldnt(
    windowA,
    Conversation.messageContent.strategy,
    Conversation.messageContent.selector,
    msg2,
  );
});
