import type { Page } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import {
  Conversation,
  ConversationSettings,
  Global,
  HomeScreen,
  LeftPane,
  Settings,
} from './locators';
import { openApp } from './setup/open';
import { recoverFromSeed } from './setup/recovery_using_seed';
import {
  test_group_Alice1_Bob1_Charlie1,
  test_group_Alice2_Bob1_Charlie1,
} from './setup/sessionTest';
import { leaveGroup } from './utilities/leave_group';
import {
  checkModalStrings,
  clickOn,
  clickOnMatchingText,
  clickOnWithText,
  hasElementBeenDeleted,
  waitForTestIdWithText,
} from './utilities/utils';

test_group_Alice2_Bob1_Charlie1(
  'Leaving group syncs',
  async ({
    aliceWindow1,
    aliceWindow2,
    bobWindow1,
    charlie,
    charlieWindow1,
    groupCreated,
  }) => {
    // Check group conversation is in conversation list of linked device
    await waitForTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // User C to leave group
    await leaveGroup(charlieWindow1, groupCreated);
    // Check for user A for control message that userC left group
    // await sleepFor(1000);
    // Click on group
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    await waitForTestIdWithText(
      aliceWindow1,
      'group-update-message',
      englishStrippedStr('groupMemberLeft')
        .withArgs({
          name: charlie.userName,
        })
        .toString(),
    );
    // Check for linked device (userA)
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    await waitForTestIdWithText(
      aliceWindow2,
      'group-update-message',
      englishStrippedStr('groupMemberLeft')
        .withArgs({
          name: charlie.userName,
        })
        .toString(),
    );
    // Check for user B
    await waitForTestIdWithText(
      bobWindow1,
      'group-update-message',
      englishStrippedStr('groupMemberLeft')
        .withArgs({
          name: charlie.userName,
        })
        .toString(),
    );
  },
);

test_group_Alice1_Bob1_Charlie1(
  'Restore group',
  async ({ alice, bob, charlie, groupCreated }) => {
    const [aliceWindow2] = await openApp(1);
    // Check group conversation is in conversation list on linked device
    // Restore account on a linked device
    await recoverFromSeed(aliceWindow2, alice.recoveryPassword);
    // Does group appear?
    await waitForTestIdWithText(
      aliceWindow2,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      aliceWindow2,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOn(aliceWindow2, Conversation.conversationSettingsIcon);
    // Check right panel has correct name
    await waitForTestIdWithText(aliceWindow2, 'group-name');
    await clickOn(aliceWindow2, ConversationSettings.manageMembersOption);
    await waitForTestIdWithText(
      aliceWindow2,
      'modal-heading',
      englishStrippedStr('manageMembers').toString(),
    );
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        bob.userName,
      ),
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        charlie.userName,
      ),
    ]);
  },
);

async function clearDataOnWindow(window: Page) {
  await clickOn(window, LeftPane.settingsButton);
  // Click on clear data option on left pane
  await clickOnWithText(
    window,
    Settings.clearDataMenuItem,
    englishStrippedStr('sessionClearData').toString(),
  );
  await checkModalStrings(
    window,
    englishStrippedStr('clearDataAll').toString(),
    englishStrippedStr('clearDataAllDescription').toString(),
    'deleteAccountModal',
  );
  await clickOnWithText(
    window,
    Global.confirmButton,
    englishStrippedStr('clear').toString(),
  );
  await checkModalStrings(
    window,
    englishStrippedStr('clearDataAll').toString(),
    englishStrippedStr('clearDeviceDescription').toString(),
    'deleteAccountModal',
  );
  await clickOnMatchingText(window, englishStrippedStr('clear').toString());
}

// Delete device data > Restore account
test_group_Alice1_Bob1_Charlie1(
  'Delete and restore group',
  async ({ alice, bob, charlie, groupCreated }) => {
    const [aliceWindow2] = await openApp(1);
    // Check group conversation is in conversation list on linked device
    // Restore account on a linked device
    await recoverFromSeed(aliceWindow2, alice.recoveryPassword);
    // Does group appear?
    await waitForTestIdWithText(
      aliceWindow2,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      aliceWindow2,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOn(aliceWindow2, Conversation.conversationSettingsIcon);
    await clickOn(aliceWindow2, ConversationSettings.manageMembersOption);
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        bob.userName,
      ),
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        charlie.userName,
      ),
    ]);
    await clickOn(aliceWindow2, Global.cancelButton);
    await clickOn(aliceWindow2, Global.modalCloseButton);
    // Delete device data on alicewindow2
    await clearDataOnWindow(aliceWindow2);
    const [restoredWindow] = await openApp(1);
    await recoverFromSeed(restoredWindow, alice.recoveryPassword);
    // Does group appear?
    await waitForTestIdWithText(
      restoredWindow,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnWithText(
      restoredWindow,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      restoredWindow,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOn(restoredWindow, Conversation.conversationSettingsIcon);
    await clickOn(restoredWindow, ConversationSettings.manageMembersOption);
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        restoredWindow,
        Global.contactItem.selector,
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(
        restoredWindow,
        Global.contactItem.selector,
        bob.userName,
      ),
      waitForTestIdWithText(
        restoredWindow,
        Global.contactItem.selector,
        charlie.userName,
      ),
    ]);
    // Do it all again
    await clickOn(restoredWindow, Global.cancelButton);
    await clickOn(restoredWindow, Global.modalCloseButton);
    // Delete device data on restoredWindow
    await clearDataOnWindow(restoredWindow);
    const [restoredWindow2] = await openApp(1);
    await recoverFromSeed(restoredWindow2, alice.recoveryPassword);
    // Does group appear?
    await waitForTestIdWithText(
      restoredWindow2,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnWithText(
      restoredWindow2,
      HomeScreen.conversationItemName,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      restoredWindow2,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOn(restoredWindow2, Conversation.conversationSettingsIcon);
    await clickOn(restoredWindow2, ConversationSettings.manageMembersOption);
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        restoredWindow2,
        Global.contactItem.selector,
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(
        restoredWindow2,
        Global.contactItem.selector,
        bob.userName,
      ),
      waitForTestIdWithText(
        restoredWindow2,
        Global.contactItem.selector,
        charlie.userName,
      ),
    ]);
  },
);

test_group_Alice2_Bob1_Charlie1(
  'Delete group linked device',
  async ({
    aliceWindow1,
    aliceWindow2,
    bobWindow1,
    charlieWindow1,
    groupCreated,
  }) => {
    await clickOn(aliceWindow1, Conversation.conversationSettingsIcon);
    await clickOn(aliceWindow1, ConversationSettings.leaveOrDeleteGroupOption);
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('groupDelete').toString(),
      englishStrippedStr('groupDeleteDescription')
        .withArgs({ group_name: groupCreated.userName })
        .toString(),
      'confirmModal',
    );
    await clickOn(aliceWindow1, Global.confirmButton);
    await Promise.all(
      [bobWindow1, charlieWindow1].map(async (w) => {
        await waitForTestIdWithText(
          w,
          'empty-conversation-control-message',
          englishStrippedStr('groupDeletedMemberDescription')
            .withArgs({ group_name: groupCreated.userName })
            .toString(),
        );
      }),
    );
    await Promise.all(
      [aliceWindow1, aliceWindow2].map(async (w) => {
        await hasElementBeenDeleted(
          w,
          'data-testid',
          HomeScreen.conversationItemName.selector,
          10_000,
          groupCreated.userName,
        );
      }),
    );
  },
);
