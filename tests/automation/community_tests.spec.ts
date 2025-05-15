import { testCommunityName } from './constants/community';
import { test_Alice_1W_Bob_1W, test_Alice_2W } from './setup/sessionTest';
import { joinCommunity } from './utilities/join_community';
import { sendMessage } from './utilities/message';
import { replyTo } from './utilities/reply_message';
import { sendMedia } from './utilities/send_media';
import { clickOnTestIdWithText } from './utilities/utils';

test_Alice_2W('Join community', async ({ aliceWindow1, aliceWindow2 }) => {
  await joinCommunity(aliceWindow1);
  await clickOnTestIdWithText(aliceWindow1, 'scroll-to-bottom-button');
  await sendMessage(aliceWindow1, 'Hello, community!');
  // Check linked device for community
  await clickOnTestIdWithText(
    aliceWindow2,
    'module-conversation__user__profile-name',
    testCommunityName,
  );
});

test_Alice_1W_Bob_1W(
  'Send image to community',
  async ({ alice, bob, aliceWindow1, bobWindow1 }) => {
    const testMessage = 'Testing sending images to communities';
    const testImageMessage = `Image message + ${Date.now()}`;
    const testReply = `${bob.userName} replying to image from ${alice.userName}`;
    await Promise.all([joinCommunity(aliceWindow1), joinCommunity(bobWindow1)]);
    // await Promise.all([
    //   waitForLoadingAnimationToFinish(aliceWindow1, 'loading-spinner'),
    //   waitForLoadingAnimationToFinish(bobWindow1, 'loading-spinner'),
    // ]);
    await Promise.all([
      clickOnTestIdWithText(aliceWindow1, 'scroll-to-bottom-button'),
      clickOnTestIdWithText(bobWindow1, 'scroll-to-bottom-button'),
    ]);
    await sendMessage(aliceWindow1, testMessage);
    // Check linked device for community
    await clickOnTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
      testCommunityName,
    );
    await sendMedia(
      aliceWindow1,
      'sample_files/test-image.png',
      testImageMessage,
    );
    await replyTo({
      senderWindow: bobWindow1,
      textMessage: testImageMessage,
      replyText: testReply,
      receiverWindow: aliceWindow1,
    });
  },
);
