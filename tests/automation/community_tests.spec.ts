import { testCommunityName } from './constants/community';
import { Conversation, HomeScreen } from './locators';
import { test_Alice_1W_Bob_1W, test_Alice_2W } from './setup/sessionTest';
import { joinCommunity } from './utilities/join_community';
import { sendMessage } from './utilities/message';
import { replyTo } from './utilities/reply_message';
import { sendMedia } from './utilities/send_media';
import { clickOn, clickOnWithText } from './utilities/utils';

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
