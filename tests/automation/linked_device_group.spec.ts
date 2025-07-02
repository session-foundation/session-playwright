import type { Page } from '@playwright/test';
import { englishStrippedStr } from '../localization/englishStrippedStr';
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
  waitForLoadingAnimationToFinish,
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
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      aliceWindow2,
      'header-conversation-name',
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(aliceWindow2, 'conversation-options-avatar');
    // Check right panel has correct name
    await waitForTestIdWithText(aliceWindow2, 'group-name');
    await clickOnTestIdWithText(aliceWindow2, 'manage-members-menu-option');
    await waitForTestIdWithText(
      aliceWindow2,
      'modal-heading',
      englishStrippedStr('manageMembers').toString(),
    );
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow2,
        'contact',
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(aliceWindow2, 'contact', bob.userName),
      waitForTestIdWithText(aliceWindow2, 'contact', charlie.userName),
    ]);
  },
);

async function clearDataOnWindow(window: Page) {
  await clickOnTestIdWithText(window, 'settings-section');
  // Click on clear data option on left pane
  await clickOnTestIdWithText(
    window,
    'clear-data-settings-menu-item',
    englishStrippedStr('sessionClearData').toString(),
  );
  await checkModalStrings(
    window,
    englishStrippedStr('clearDataAll').toString(),
    englishStrippedStr('clearDataAllDescription').toString(),
  );
  await clickOnTestIdWithText(
    window,
    'session-confirm-ok-button',
    englishStrippedStr('clear').toString(),
  );
  await checkModalStrings(
    window,
    englishStrippedStr('clearDataAll').toString(),
    englishStrippedStr('clearDeviceDescription').toString(),
  );
  await clickOnMatchingText(window, englishStrippedStr('clear').toString());
  await waitForLoadingAnimationToFinish(window, 'loading-spinner');
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
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      aliceWindow2,
      'header-conversation-name',
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(aliceWindow2, 'conversation-options-avatar');
    await clickOnTestIdWithText(aliceWindow2, 'manage-members-menu-option');
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow2,
        'contact',
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(aliceWindow2, 'contact', bob.userName),
      waitForTestIdWithText(aliceWindow2, 'contact', charlie.userName),
    ]);
    await clickOnTestIdWithText(aliceWindow2, 'session-confirm-cancel-button');
    await clickOnTestIdWithText(aliceWindow2, 'modal-close-button');
    // Delete device data on alicewindow2
    await clearDataOnWindow(aliceWindow2);
    const [restoredWindow] = await openApp(1);
    await recoverFromSeed(restoredWindow, alice.recoveryPassword);
    // Does group appear?
    await waitForTestIdWithText(
      restoredWindow,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnTestIdWithText(
      restoredWindow,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      restoredWindow,
      'header-conversation-name',
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(restoredWindow, 'conversation-options-avatar');
    await clickOnTestIdWithText(restoredWindow, 'manage-members-menu-option');
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        restoredWindow,
        'contact',
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(restoredWindow, 'contact', bob.userName),
      waitForTestIdWithText(restoredWindow, 'contact', charlie.userName),
    ]);
    // Do it all again
    await clickOnTestIdWithText(
      restoredWindow,
      'session-confirm-cancel-button',
    );
    await clickOnTestIdWithText(restoredWindow, 'modal-close-button');
    // Delete device data on restoredWindow
    await clearDataOnWindow(restoredWindow);
    const [restoredWindow2] = await openApp(1);
    await recoverFromSeed(restoredWindow2, alice.recoveryPassword);
    // Does group appear?
    await waitForTestIdWithText(
      restoredWindow2,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check group for members, conversation name and messages
    await clickOnTestIdWithText(
      restoredWindow2,
      'module-conversation__user__profile-name',
      groupCreated.userName,
    );
    // Check header name
    await waitForTestIdWithText(
      restoredWindow2,
      'header-conversation-name',
      groupCreated.userName,
    );
    // Check for group members
    await clickOnTestIdWithText(restoredWindow2, 'conversation-options-avatar');
    await clickOnTestIdWithText(restoredWindow2, 'manage-members-menu-option');
    // Check for You, Bob and Charlie
    await Promise.all([
      waitForTestIdWithText(
        restoredWindow2,
        'contact',
        englishStrippedStr('you').toString(),
      ),
      waitForTestIdWithText(restoredWindow2, 'contact', bob.userName),
      waitForTestIdWithText(restoredWindow2, 'contact', charlie.userName),
    ]);
  },
);
