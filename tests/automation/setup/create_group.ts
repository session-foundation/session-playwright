import { Page } from '@playwright/test';
import { englishStrippedStr } from '../../localization/englishStrippedStr';
import { Group, User } from '../types/testing';
import { sendMessage } from '../utilities/message';
import { sendNewMessage } from '../utilities/send_message';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
  typeIntoInput,
  waitForTestIdWithText,
  waitForTextMessages,
} from '../utilities/utils';
import { sortByPubkey } from '../../pubkey';

export const createGroup = async (
  userName: string,
  userOne: User,
  windowA: Page,
  userTwo: User,
  windowB: Page,
  userThree: User,
  windowC: Page,
): Promise<Group> => {
  const group: Group = { userName, userOne, userTwo, userThree };
  const messageAB = `${userOne.userName} to ${userTwo.userName}`;
  const messageBA = `${userTwo.userName} to ${userOne.userName}`;
  const messageCA = `${userThree.userName} to ${userOne.userName}`;
  const messageAC = `${userOne.userName} to ${userThree.userName}`;
  const msgAToGroup = `${userOne.userName} -> ${group.userName}`;
  const msgBToGroup = `${userTwo.userName} -> ${group.userName}`;
  const msgCToGroup = `${userThree.userName} -> ${group.userName}`;
  // Add contacts
  await sendNewMessage(
    windowA,
    userThree.accountid,
    `${messageAC} Time: ${Date.now()}`,
  );
  await sendNewMessage(
    windowA,
    userTwo.accountid,
    `${messageAB} Time: ${Date.now()}`,
  );
  await sendNewMessage(
    windowB,
    userOne.accountid,
    `${messageBA} Time: ${Date.now()}`,
  );
  await sendNewMessage(
    windowC,
    userOne.accountid,
    `${messageCA} Time: ${Date.now()}`,
  );
  // Focus screen on window C to allow user C to become contact
  await clickOnTestIdWithText(windowC, 'messages-container');
  // wait for user C to be contact before moving to create group
  // Create group with existing contact and session ID (of non-contact)
  // Click new closed group tab
  await clickOnTestIdWithText(windowA, 'new-conversation-button');
  await clickOnTestIdWithText(windowA, 'chooser-new-group');
  // Enter group name
  await typeIntoInput(windowA, 'new-closed-group-name', group.userName);
  // Select user B
  await clickOnMatchingText(windowA, userTwo.userName);
  // Select user C
  await clickOnMatchingText(windowA, userThree.userName);
  // Click Next
  await clickOnTestIdWithText(windowA, 'create-group-button');
  // Check group was successfully created
  await clickOnMatchingText(windowB, group.userName);
  await waitForTestIdWithText(
    windowB,
    'header-conversation-name',
    group.userName,
  );
  // Need to sort users by pubkey
  const [firstUser, secondUser] = sortByPubkey(userTwo, userThree);
  // Make sure the empty state is in windowA
  // Updated in group v2
  await waitForTestIdWithText(
    windowA,
    'group-update-message',
    englishStrippedStr('groupMemberNewTwo')
      .withArgs({ name: firstUser, other_name: secondUser })
      .toString(),
  );
  // Click on message section
  await Promise.all([
    clickOnTestIdWithText(windowB, 'message-section'),
    clickOnTestIdWithText(windowC, 'message-section'),
  ]);
  // Click on test group
  await Promise.all([
    clickOnTestIdWithText(
      windowB,
      'module-conversation__user__profile-name',
      group.userName,
    ),
    clickOnTestIdWithText(
      windowC,
      'module-conversation__user__profile-name',
      group.userName,
    ),
  ]);
  // Make sure the empty state is in windowB & windowC
  await Promise.all([
    waitForTestIdWithText(
      windowB,
      'group-update-message',
      englishStrippedStr('groupInviteYouAndOtherNew')
        .withArgs({ other_name: userThree.userName })
        .toString(),
    ),
    waitForTestIdWithText(
      windowC,
      'group-update-message',
      englishStrippedStr('groupInviteYouAndOtherNew')
        .withArgs({ other_name: userTwo.userName })
        .toString(),
    ),
  ]);
  // Send message in group chat from user A
  await sendMessage(windowA, msgAToGroup);
  // Focus screen
  await clickOnMatchingText(windowA, msgAToGroup);

  // Send message in group chat from user B
  await sendMessage(windowB, msgBToGroup);
  await clickOnMatchingText(windowB, msgBToGroup);

  // Send message from C to the group
  await sendMessage(windowC, msgCToGroup);
  await clickOnMatchingText(windowC, msgCToGroup);

  // Verify that each messages was received by the other two accounts

  // windowA should see the message from B and the message from C
  await waitForTextMessages(windowA, [msgBToGroup, msgCToGroup]);

  // windowB should see the message from A and the message from C
  await waitForTextMessages(windowB, [msgAToGroup, msgCToGroup]);

  // windowC must see the message from A and the message from B
  await waitForTextMessages(windowC, [msgAToGroup, msgBToGroup]);

  // Focus screen
  // await clickOnTestIdWithText(windowB, 'scroll-to-bottom-button');

  return { userName, userOne, userTwo, userThree };
};
