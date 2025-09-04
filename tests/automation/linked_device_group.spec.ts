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
  test_group_Alice_1W_Bob_1W_Charlie_1W,
  test_group_Alice_2W_Bob_1W_Charlie_1W,
} from './setup/sessionTest';
import { leaveGroup } from './utilities/leave_group';
import {
  checkModalStrings,
  clickOnMatchingText,
  clickOnTestIdWithText,
  waitForTestIdWithText,
} from './utilities/utils';

test_group_Alice_2W_Bob_1W_Charlie_1W(
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
    await clickOnTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
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
    await clickOnTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
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

test_group_Alice_1W_Bob_1W_Charlie_1W(
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
    await clickOnTestIdWithText(
      aliceWindow2,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      aliceWindow2,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(
      aliceWindow2,
      Conversation.conversationSettingsIcon.selector,
    );
    // Check right panel has correct name
    await waitForTestIdWithText(aliceWindow2, 'group-name');
    await clickOnTestIdWithText(
      aliceWindow2,
      ConversationSettings.manageMembersOption.selector,
    );
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
  await clickOnTestIdWithText(window, LeftPane.settingsButton.selector);
  // Click on clear data option on left pane
  await clickOnTestIdWithText(
    window,
    Settings.clearDataMenuItem.selector,
    englishStrippedStr('sessionClearData').toString(),
  );
  await checkModalStrings(
    window,
    englishStrippedStr('clearDataAll').toString(),
    englishStrippedStr('clearDataAllDescription').toString(),
    'deleteAccountModal',
  );
  await clickOnTestIdWithText(
    window,
    Global.confirmButton.selector,
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
test_group_Alice_1W_Bob_1W_Charlie_1W(
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
    await clickOnTestIdWithText(
      aliceWindow2,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      aliceWindow2,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(
      aliceWindow2,
      Conversation.conversationSettingsIcon.selector,
    );
    await clickOnTestIdWithText(
      aliceWindow2,
      ConversationSettings.manageMembersOption.selector,
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
    await clickOnTestIdWithText(aliceWindow2, Global.cancelButton.selector);
    await clickOnTestIdWithText(aliceWindow2, Global.modalCloseButton.selector);
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
    await clickOnTestIdWithText(
      restoredWindow,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      restoredWindow,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(
      restoredWindow,
      Conversation.conversationSettingsIcon.selector,
    );
    await clickOnTestIdWithText(
      restoredWindow,
      ConversationSettings.manageMembersOption.selector,
    );
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
    await clickOnTestIdWithText(restoredWindow, Global.cancelButton.selector);
    await clickOnTestIdWithText(
      restoredWindow,
      Global.modalCloseButton.selector,
    );
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
    await clickOnTestIdWithText(
      restoredWindow2,
      HomeScreen.conversationItemName.selector,
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      restoredWindow2,
      Conversation.conversationHeader.selector,
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(
      restoredWindow2,
      Conversation.conversationSettingsIcon.selector,
    );
    await clickOnTestIdWithText(
      restoredWindow2,
      ConversationSettings.manageMembersOption.selector,
    );
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
