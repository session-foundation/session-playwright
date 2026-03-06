import { tStripped } from '../localization/lib';
import { testCommunityName } from './constants/community';
import { Conversation, Global, HomeScreen } from './locators';
import { newUser } from './setup/new_user';
import { recoverFromSeed } from './setup/recovery_using_seed';
import { sessionTestTwoWindows } from './setup/sessionTest';
import { scrollToBottomLookingForMessage } from './utilities/conversation';
import {
  assertAdminIsKnown,
  joinCommunity,
  joinOrOpenCommunity,
} from './utilities/join_community';
import { sendMessage, waitForMessageStatus } from './utilities/message';
import {
  clickOn,
  clickOnWithText,
  hasElementBeenDeleted,
  hasElementPoppedUpThatShouldnt,
  pasteIntoInput,
  rightClickOnWithText,
  waitForTestIdWithText,
} from './utilities/utils';

const banUserString = tStripped('banUser');
const unbanUserString = tStripped('banUnbanUser');

const actionsToDo = ['ban_unban', 'ban_delete_all'] as const;

actionsToDo.forEach((action) => {
  sessionTestTwoWindows(`Community admin ${action}`, async ([alice1, bob1]) => {
    assertAdminIsKnown();
    const firstMsgNotBanned = `${action} me! - ${Date.now()}`;
    const secondMsgBanned = `I'm banned :( - ${Date.now()}`;
    const thirdMsgUnbanned = `Freedom! - ${Date.now()}`;

    const [_alice, bob] = await Promise.all([
      recoverFromSeed(alice1, process.env.SOGS_ADMIN_SEED!, {
        fallbackName: 'Admin',
      }),
      newUser(bob1, 'Bob'),
    ]);
    await Promise.all([joinOrOpenCommunity(alice1), joinCommunity(bob1)]);
    await sendMessage(bob1, firstMsgNotBanned);
    await scrollToBottomLookingForMessage({
      window: alice1,
      msg: firstMsgNotBanned,
    });
    await rightClickOnWithText(
      alice1,
      Conversation.messageContent,
      firstMsgNotBanned,
    );
    await clickOnWithText(alice1, Global.contextMenuItem, banUserString, {
      strictMode: false,
      maxWait: 1_00000,
    });
    if (action === 'ban_unban') {
      await clickOn(alice1, Conversation.banUserButton);
      await pasteIntoInput(
        bob1,
        Conversation.messageInput.selector,
        secondMsgBanned,
      );
      await clickOn(bob1, Conversation.sendMessageButton);
      await waitForMessageStatus(bob1, secondMsgBanned, 'failed');
      await rightClickOnWithText(
        alice1,
        Conversation.messageContent,
        firstMsgNotBanned,
      );
      await clickOnWithText(alice1, Global.contextMenuItem, unbanUserString, {
        strictMode: false,
      });
      await clickOn(alice1, Conversation.unbanUserButton);
    } else {
      await clickOn(alice1, Conversation.banAndDeleteAllButton);
      await hasElementBeenDeleted(alice1, Conversation.messageContent, {
        maxWait: 10_000,
        text: firstMsgNotBanned,
      });
      // Bob was banned, so he can't send a message
      await pasteIntoInput(
        bob1,
        Conversation.messageInput.selector,
        secondMsgBanned,
      );
      await clickOn(bob1, Conversation.sendMessageButton);
      await waitForMessageStatus(bob1, secondMsgBanned, 'failed');
      await hasElementPoppedUpThatShouldnt(
        alice1,
        Conversation.messageContent,
        secondMsgBanned,
      );
      // Alice unban Bob via the convo right click modal (as all messages from Bob have been removed)
      await rightClickOnWithText(
        alice1,
        HomeScreen.conversationItemName,
        testCommunityName,
      );
      await clickOnWithText(alice1, Global.contextMenuItem, unbanUserString, {
        strictMode: false,
      });
      await pasteIntoInput(
        alice1,
        Conversation.unbanUserInput.selector,
        bob.accountid,
      );
      await clickOn(alice1, Conversation.unbanUserButton);
      await waitForTestIdWithText(
        alice1,
        Global.toast.selector,
        tStripped('banUnbanUserUnbanned'),
      );
    }

    // here the user has been either
    // - ban & unbanned or
    // - banned_delete_all & unbanned
    // So he should be able to send a message again
    await sendMessage(bob1, thirdMsgUnbanned);
    await waitForTestIdWithText(
      alice1,
      Conversation.messageContent.selector,
      thirdMsgUnbanned,
    );
  });
});
