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
  test_group_Alice1_Bob1_Charlie1,
  test_group_Alice1_Bob1_Charlie1_Dracula1,
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
  waitForTextMessage,
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

test_group_Alice1_Bob1_Charlie1_Dracula1(
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

test_group_Alice1_Bob1_Charlie1(
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
    await clickOn(aliceWindow1, Conversation.conversationSettingsIcon);
    await clickOn(aliceWindow1, ConversationSettings.editGroupButton);
    await clickOn(aliceWindow1, ConversationSettings.clearGroupNameButton);
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

test_group_Alice1_Bob1_Charlie1(
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
    const members = [
      { user: alice, window: aliceWindow1, others: [bob, charlie] },
      { user: bob, window: bobWindow1, others: [alice, charlie] },
      { user: charlie, window: charlieWindow1, others: [alice, bob] },
    ];

    // All users open group conversation
    await Promise.all(
      members.map((m) =>
        clickOnWithText(
          m.window,
          HomeScreen.conversationItemName,
          groupCreated.userName,
        ),
      ),
    );

    // All users type @ to open mentions
    await Promise.all(
      members.map((m) =>
        typeIntoInput(m.window, 'message-input-text-area', '@'),
      ),
    );

    // All users check mentions dropdown shows "You" + other members
    await Promise.all(
      members.flatMap((m) =>
        ['You', ...m.others.map((o) => o.userName)].map((name) =>
          waitForTestIdWithText(m.window, 'mentions-container-row', name),
        ),
      ),
    );

    // All users click on next member (Alice→Bob, Bob→Charlie, Charlie→Alice) and send
    await Promise.all(
      members.map(async (m, i) => {
        await clickOnWithText(
          m.window,
          Conversation.mentionsItem,
          members[(i + 1) % members.length].user.userName,
        );
        await clickOn(m.window, Conversation.sendMessageButton);
      }),
    );

    // All users should see all mentions ("You" for their own tag, names for others)
    await Promise.all(
      members.flatMap((m) =>
        ['You', ...m.others.map((o) => o.userName)].map((text) =>
          waitForTextMessage(m.window, text),
        ),
      ),
    );
  },
);

test_group_Alice1_Bob1_Charlie1(
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
