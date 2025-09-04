import { englishStrippedStr } from '../localization/englishStrippedStr';
import { doForAll, sleepFor } from '../promise_utils';
import {
  Conversation,
  ConversationSettings,
  Global,
  HomeScreen,
} from './locators';
import { createGroup } from './setup/create_group';
import { newUser } from './setup/new_user';
import {
  sessionTestThreeWindows,
  test_group_Alice_1W_Bob_1W_Charlie_1W,
  test_group_Alice_1W_Bob_1W_Charlie_1W_Dracula_1W,
} from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import { leaveGroup } from './utilities/leave_group';
import { renameGroup } from './utilities/rename_group';
import {
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  clickOnWithText,
  grabTextFromElement,
  typeIntoInput,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utilities/utils';

// Note: Note using the group fixture here as we want to test it thoroughly
sessionTestThreeWindows('Create group', async ([windowA, windowB, windowC]) => {
  // Open Electron
  const [userA, userB, userC] = await Promise.all([
    newUser(windowA, 'Alice'),
    newUser(windowB, 'Bob'),
    newUser(windowC, 'Charlie'),
  ]);

  await createGroup(
    'Test for group creation',
    userA,
    windowA,
    userB,
    windowB,
    userC,
    windowC,
  );
  // Check config messages in all windows
  await sleepFor(1000);
  // await waitForTestIdWithText(windowA, 'control-message');
});

test_group_Alice_1W_Bob_1W_Charlie_1W_Dracula_1W(
  'Add contact to group',
  async ({
    alice,
    aliceWindow1,
    bobWindow1,
    charlieWindow1,
    dracula,
    draculaWindow1,
    groupCreated,
  }) => {
    await createContact(aliceWindow1, draculaWindow1, alice, dracula);
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'conversation-options-avatar',
    });
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'invite-contacts-menu-option',
    });
    // Waiting for animation of right panel to appear
    await sleepFor(1000);
    await clickOnMatchingText(aliceWindow1, dracula.userName);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('membersInviteTitle').toString(),
    );
    // even if Bob and Charlie do not know Dracula's name,
    // Alice sets Dracula's name in the group members that every one will use as a fallback
    await doForAll(
      async (w) => {
        return waitForTestIdWithText(
          w,
          'group-update-message',
          englishStrippedStr('groupMemberNew')
            .withArgs({ name: dracula.userName })
            .toString(),
        );
      },
      [aliceWindow1, bobWindow1, charlieWindow1],
    );
    await clickOn(draculaWindow1, Global.backButton);
    await clickOnWithText(
      draculaWindow1,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
  },
);

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Change group name',
  async ({ aliceWindow1, bobWindow1, charlieWindow1, groupCreated }) => {
    const newGroupName = 'New group name';
    const expectedError = englishStrippedStr('groupNameEnterPlease').toString();
    // Change the name of the group and check that it syncs to all devices (config messages)
    // Click on already created group
    // Check that renaming a group is working
    await renameGroup(aliceWindow1, groupCreated.userName, newGroupName);
    // Check config message in window B for group name change
    await clickOnMatchingText(bobWindow1, newGroupName);
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('groupNameNew')
        .withArgs({ group_name: newGroupName })
        .toString(),
    );
    await clickOnMatchingText(charlieWindow1, newGroupName);
    await waitForMatchingText(
      charlieWindow1,
      englishStrippedStr('groupNameNew')
        .withArgs({ group_name: newGroupName })
        .toString(),
    );
    // Click on conversation options
    // Check to see that you can't change group name to empty string
    // Click on edit group name
    await clickOn(
      aliceWindow1,
      Conversation.conversationSettingsIcon,
    );
    await clickOn(
      aliceWindow1,
      ConversationSettings.editGroupButton,
    );
    await clickOn(
      aliceWindow1,
      ConversationSettings.clearGroupNameButton,
    );
    await waitForTestIdWithText(aliceWindow1, Global.errorMessage.selector);
    const actualError = await grabTextFromElement(
      aliceWindow1,
      'data-testid',
      Global.errorMessage.selector,
    );
    if (actualError !== expectedError) {
      throw new Error(
        `Expected error message: ${expectedError}, but got: ${actualError}`,
      );
    }
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('cancel').toString(),
    );
    await clickOn(aliceWindow1, Global.modalCloseButton);
  },
);

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Test mentions',
  async ({
    alice,
    aliceWindow1,
    bob,
    bobWindow1,
    charlie,
    charlieWindow1,
    groupCreated,
  }) => {
    // in windowA we should be able to mentions bob and userC

    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    await typeIntoInput(aliceWindow1, 'message-input-text-area', '@');
    // does 'message-input-text-area' have aria-expanded: true when @ is typed into input
    await waitForTestIdWithText(aliceWindow1, 'mentions-popup-row');
    await waitForTestIdWithText(
      aliceWindow1,
      'mentions-popup-row',
      bob.userName,
    );
    await waitForTestIdWithText(
      aliceWindow1,
      'mentions-popup-row',
      charlie.userName,
    );
    // ALice tags Bob
    await clickOnWithText(
      aliceWindow1,
      Conversation.mentionsPopup,
      bob.userName,
    );
    await waitForMatchingText(bobWindow1, 'You');

    // in windowB we should be able to mentions alice and charlie
    await clickOnWithText(
      bobWindow1,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    await typeIntoInput(bobWindow1, 'message-input-text-area', '@');
    // does 'message-input-text-area' have aria-expanded: true when @ is typed into input
    await waitForTestIdWithText(bobWindow1, 'mentions-popup-row');
    await waitForTestIdWithText(
      bobWindow1,
      'mentions-popup-row',
      alice.userName,
    );
    await waitForTestIdWithText(
      bobWindow1,
      'mentions-popup-row',
      charlie.userName,
    );
    // Bob tags Charlie
    await clickOnWithText(
      bobWindow1,
      Conversation.mentionsPopup,
      charlie.userName,
    );
    await waitForMatchingText(charlieWindow1, 'You');

    // in charlieWindow1 we should be able to mentions alice and userB
    await clickOnWithText(
      charlieWindow1,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    await typeIntoInput(charlieWindow1, 'message-input-text-area', '@');
    // does 'message-input-text-area' have aria-expanded: true when @ is typed into input
    await waitForTestIdWithText(charlieWindow1, 'mentions-popup-row');
    await waitForTestIdWithText(
      charlieWindow1,
      'mentions-popup-row',
      alice.userName,
    );
    await waitForTestIdWithText(
      charlieWindow1,
      'mentions-popup-row',
      bob.userName,
    );
    // Charlie tags Alice
    await clickOnWithText(
      charlieWindow1,
      Conversation.mentionsPopup,
      alice.userName,
    );
    await waitForMatchingText(aliceWindow1, 'You');
  },
);

test_group_Alice_1W_Bob_1W_Charlie_1W(
  'Leave group',
  async ({
    aliceWindow1,
    bobWindow1,
    charlie,
    charlieWindow1,
    groupCreated,
  }) => {
    await leaveGroup(charlieWindow1, groupCreated);
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        'group-update-message',
        englishStrippedStr('groupMemberLeft')
          .withArgs({ name: charlie.userName })
          .toString(),
      ),
      waitForTestIdWithText(
        bobWindow1,
        'group-update-message',
        englishStrippedStr('groupMemberLeft')
          .withArgs({ name: charlie.userName })
          .toString(),
      ),
    ]);
  },
);
