import { expect } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import { sleepFor } from '../promise_utils';
import {
  Conversation,
  Global,
  HomeScreen,
  LeftPane,
  Settings,
} from './locators';
import { newUser } from './setup/new_user';
import {
  sessionTestTwoWindows,
  test_Alice_1W_Bob_1W,
  test_Alice_1W_no_network,
  test_Alice_2W,
} from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import { sendMessage, waitForReadTick } from './utilities/message';
import { compareElementScreenshot } from './utilities/screenshot';
import {
  checkModalStrings,
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  clickOnWithText,
  doesElementExist,
  hasElementBeenDeleted,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
  waitForMatchingText,
  waitForTestIdWithText,
} from './utilities/utils';

const cancelString = englishStrippedStr('cancel').toString();
const saveString = englishStrippedStr('save').toString();
const removeString = englishStrippedStr('remove').toString();

// Send message in one to one conversation with new contact
sessionTestTwoWindows('Create contact', async ([windowA, windowB]) => {
  // no fixture for that one
  const [userA, userB] = await Promise.all([
    newUser(windowA, 'Alice'),
    newUser(windowB, 'Bob'),
  ]);
  await createContact(windowA, windowB, userA, userB);
  // Navigate to contacts tab in User B's window
  await waitForTestIdWithText(
    windowB,
    Conversation.messageRequestAcceptControlMessage.selector,
    englishStrippedStr('messageRequestYouHaveAccepted')
      .withArgs({
        name: userA.userName,
      })
      .toString(),
  );
  await clickOn(windowB, Global.backButton);
  await Promise.all([
    clickOnElement({
      window: windowA,
      strategy: 'data-testid',
      selector: 'new-conversation-button',
    }),
    clickOnElement({
      window: windowB,
      strategy: 'data-testid',
      selector: 'new-conversation-button',
    }),
  ]);
  await Promise.all([
    waitForTestIdWithText(windowA, Global.contactItem.selector, userB.userName),
    waitForTestIdWithText(windowB, Global.contactItem.selector, userA.userName),
  ]);
});

test_Alice_1W_Bob_1W(
  'Block user in conversation list',
  async ({ aliceWindow1, bobWindow1, alice, bob }) => {
    // Create contact and send new message
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // Check to see if User B is a contact
    await clickOn(aliceWindow1, HomeScreen.plusButton);
    await waitForTestIdWithText(
      aliceWindow1,
      Global.contactItem.selector,
      bob.userName,
    );
    // he is a contact, close the new conversation button tab as there is no right click allowed on it
    await clickOn(aliceWindow1, Global.backButton);
    // then right click on the contact conversation list item to show the menu
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      bob.userName,
      { rightButton: true },
    );
    // Select block
    await clickOnWithText(
      aliceWindow1,
      Global.contextMenuItem,
      englishStrippedStr('block').toString(),
    );
    // Check modal strings
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('block').toString(),
      englishStrippedStr('blockDescription')
        .withArgs({ name: bob.userName })
        .toString(),
    );
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('block').toString(),
    );
    // Verify the user was moved to the blocked contact list
    // Click on settings tab
    await clickOn(aliceWindow1, LeftPane.settingsButton);
    // click on settings section 'conversation'
    await clickOn(aliceWindow1, Settings.conversationsMenuItem);
    // Navigate to blocked users tab'
    await clickOn(aliceWindow1, Settings.blockedContactsButton);
    // select the contact to unblock by clicking on it by name
    await clickOnWithText(aliceWindow1, Global.contactItem, bob.userName);
    // Unblock user by clicking on unblock
    await clickOn(aliceWindow1, Settings.unblockButton);
    // make sure the confirm dialogs shows up
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('blockUnblock').toString(),
      englishStrippedStr('blockUnblockName')
        .withArgs({ name: bob.userName })
        .toString(),
      'blockOrUnblockModal',
    );
    // click on the unblock button
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('blockUnblock').toString(),
    );
    // make sure no blocked contacts are listed
    await waitForMatchingText(
      aliceWindow1,
      englishStrippedStr('blockBlockedNone').toString(),
    );
  },
);

test_Alice_1W_no_network('Change username', async ({ aliceWindow1 }) => {
  const newUsername = 'Tiny bubble';
  // Open Profile
  await clickOn(aliceWindow1, LeftPane.profileButton);
  // Click on current username to open edit field
  await clickOn(aliceWindow1, Settings.displayName);
  // Type in new username
  await typeIntoInput(
    aliceWindow1,
    Settings.displayNameInput.selector,
    newUsername,
  );
  await clickOnMatchingText(aliceWindow1, saveString);
  await sleepFor(1000);
  // verify name change
  expect(
    await aliceWindow1.innerText(
      `[data-testid=${Settings.displayName.selector}]`,
    ),
  ).toBe(newUsername);
  // Exit profile modal
  await clickOn(aliceWindow1, Global.modalCloseButton);
});

test_Alice_1W_no_network('Add avatar', async ({ aliceWindow1 }, testInfo) => {
  await clickOn(aliceWindow1, LeftPane.profileButton);
  await clickOn(aliceWindow1, Settings.displayName);
  await clickOn(aliceWindow1, Settings.imageUploadSection);
  await clickOn(aliceWindow1, Settings.imageUploadClick);
  await sleepFor(500);
  await clickOn(aliceWindow1, Settings.saveProfileUpdateButton);
  await waitForLoadingAnimationToFinish(
    aliceWindow1,
    Global.loadingSpinner.selector,
  );
  // Cancel button should not be visible if you added an avatar
  await expect(
    aliceWindow1.getByRole('button').filter({ hasText: cancelString }),
  ).toBeHidden();
  await clickOnMatchingText(aliceWindow1, saveString);
  await clickOn(aliceWindow1, Global.modalCloseButton);
  await sleepFor(500);
  const leftpaneAvatarContainer = await waitForTestIdWithText(
    aliceWindow1,
    LeftPane.profileButton.selector,
  );
  await compareElementScreenshot({
    element: leftpaneAvatarContainer,
    snapshotName: 'avatar-updated-blue.jpeg',
    testInfo,
  });
});

test_Alice_1W_no_network('Remove avatar', async ({ aliceWindow1 }) => {
  await clickOn(aliceWindow1, LeftPane.profileButton);
  await clickOn(aliceWindow1, Settings.displayName);
  await clickOn(aliceWindow1, Settings.imageUploadSection);
  await clickOn(aliceWindow1, Settings.imageUploadClick);
  await sleepFor(500);
  await clickOn(aliceWindow1, Settings.saveProfileUpdateButton);
  await waitForLoadingAnimationToFinish(
    aliceWindow1,
    Global.loadingSpinner.selector,
  );
  await clickOnMatchingText(aliceWindow1, saveString);
  await clickOn(aliceWindow1, Global.modalCloseButton);
  await sleepFor(500);
  // Verify that an img is present (avatar upload succeeded) but don't do full image comparison
  await expect(
    aliceWindow1.getByTestId(LeftPane.profileButton.selector).locator('img'),
  ).toBeVisible();
  await clickOn(aliceWindow1, LeftPane.profileButton);
  await clickOn(aliceWindow1, Settings.displayName);
  await clickOn(aliceWindow1, Settings.imageUploadSection);
  await aliceWindow1.getByText(removeString).click();
  await waitForLoadingAnimationToFinish(
    aliceWindow1,
    Global.loadingSpinner.selector,
  );
  // Cancel button should not be visible if you remove your avatar
  await expect(
    aliceWindow1.getByRole('button').filter({ hasText: cancelString }),
  ).toBeHidden();
  await clickOnMatchingText(aliceWindow1, saveString);
  // If removing was successful, show no img but show Alice's initials instead
  await expect(
    aliceWindow1.getByTestId(Settings.profilePicture.selector).locator('img'),
  ).toBeHidden();
  await expect(
    aliceWindow1
      .getByTestId(Settings.profilePicture.selector)
      .filter({ hasText: 'AL' }),
  ).toBeVisible();
});

test_Alice_1W_Bob_1W(
  'Set nickname',
  async ({ aliceWindow1, bobWindow1, alice, bob }) => {
    const nickname = 'new nickname for Bob';

    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      bob.userName,
      { rightButton: true },
    );
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('nicknameSet').toString(),
    );
    await sleepFor(1000);

    await typeIntoInput(aliceWindow1, 'nickname-input', nickname);
    await sleepFor(100);
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.setNicknameButton,
      saveString,
    );
    await sleepFor(1000);

    const headerUsername = await waitForTestIdWithText(
      aliceWindow1,
      'header-conversation-name',
    );
    const headerUsernameText = await headerUsername.innerText();
    console.info('Innertext ', headerUsernameText);

    expect(headerUsernameText).toBe(nickname);
    // Check conversation list name also
    const conversationListUsernameText = await waitForTestIdWithText(
      aliceWindow1,
      'module-conversation__user__profile-name',
    );
    const conversationListUsername =
      await conversationListUsernameText.innerText();
    expect(conversationListUsername).toBe(nickname);
  },
);

test_Alice_1W_Bob_1W(
  'Read status',
  async ({ aliceWindow1, bobWindow1, alice, bob }) => {
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: LeftPane.settingsButton.selector,
    });
    await clickOn(aliceWindow1, Settings.privacyMenuItem);
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: Settings.enableReadReceipts.selector,
    });
    await clickOn(aliceWindow1, Global.modalCloseButton);
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      bob.userName,
    );
    await clickOnElement({
      window: bobWindow1,
      strategy: 'data-testid',
      selector: LeftPane.settingsButton.selector,
    });
    await clickOn(bobWindow1, Settings.privacyMenuItem);

    await clickOnElement({
      window: bobWindow1,
      strategy: 'data-testid',
      selector: Settings.enableReadReceipts.selector,
    });
    await clickOn(bobWindow1, Global.modalCloseButton);
    await sendMessage(aliceWindow1, 'Testing read receipts');
    await clickOn(bobWindow1, Global.backButton);
    await clickOnWithText(
      bobWindow1,
      HomeScreen.conversationItemName,
      alice.userName,
    );
    await waitForReadTick(aliceWindow1, 'Testing read receipts');
  },
);

test_Alice_1W_Bob_1W(
  'Delete conversation',
  async ({ aliceWindow1, bobWindow1, alice, bob }) => {
    // Create contact and send new message
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await clickOn(bobWindow1, Global.backButton);
    await Promise.all(
      [aliceWindow1, bobWindow1].map((w) =>
        clickOnElement({
          window: w,
          strategy: 'data-testid',
          selector: 'new-conversation-button',
        }),
      ),
    );
    await Promise.all([
      waitForTestIdWithText(
        aliceWindow1,
        Global.contactItem.selector,
        bob.userName,
      ),
      waitForTestIdWithText(
        bobWindow1,
        Global.contactItem.selector,
        alice.userName,
      ),
    ]);
    await Promise.all(
      [aliceWindow1, bobWindow1].map((w) => clickOn(w, Global.backButton)),
    );
    // Delete contact
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      bob.userName,
      { rightButton: true },
    );
    await clickOnWithText(
      aliceWindow1,
      Global.contextMenuItem,
      englishStrippedStr('conversationsDelete').toString(),
    );
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('conversationsDelete').toString(),
      englishStrippedStr('deleteConversationDescription')
        .withArgs({ name: bob.userName })
        .toString(),
    );
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('delete').toString(),
    );
    // Check if conversation is deleted
    await hasElementBeenDeleted(
      aliceWindow1,
      'data-testid',
      Global.contactItem.selector,
      1000,
      bob.userName,
    );
  },
);

test_Alice_2W(
  'Hide recovery password',
  async ({ aliceWindow1, aliceWindow2 }) => {
    await clickOn(aliceWindow1, LeftPane.settingsButton);
    await clickOn(aliceWindow1, Settings.recoveryPasswordMenuItem);
    await clickOn(aliceWindow1, Settings.hideRecoveryPasswordButton);
    // Check first modal
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('recoveryPasswordHidePermanently').toString(),
      englishStrippedStr(
        'recoveryPasswordHidePermanentlyDescription1',
      ).toString(),
      'hideRecoveryPasswordModal',
    );
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('theContinue').toString(),
    );
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('recoveryPasswordHidePermanently').toString(),
      englishStrippedStr(
        'recoveryPasswordHidePermanentlyDescription2',
      ).toString(),
      'hideRecoveryPasswordModal',
    );
    // Click yes
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('yes').toString(),
    );
    await doesElementExist(
      aliceWindow1,
      'data-testid',
      Settings.recoveryPasswordMenuItem.selector,
    );
    // Check linked device if Recovery Password is still visible (it should be)
    await clickOn(aliceWindow2, LeftPane.settingsButton);
    await waitForTestIdWithText(
      aliceWindow2,
      Settings.recoveryPasswordMenuItem.selector,
    );
  },
);

test_Alice_1W_no_network('Invite a friend', async ({ aliceWindow1, alice }) => {
  await clickOn(aliceWindow1, HomeScreen.plusButton);
  await clickOn(aliceWindow1, HomeScreen.inviteAFriendOption);
  await waitForTestIdWithText(aliceWindow1, 'your-account-id', alice.accountid);
  await clickOn(aliceWindow1, HomeScreen.inviteAFriendCopyButton);
  // Toast
  await waitForTestIdWithText(
    aliceWindow1,
    Global.toast.selector,
    englishStrippedStr('copied').toString(),
  );
  // Wait for copy to resolve
  await sleepFor(1000);
  await waitForMatchingText(
    aliceWindow1,
    englishStrippedStr('accountIdCopied').toString(),
  );
  await waitForMatchingText(
    aliceWindow1,
    englishStrippedStr('shareAccountIdDescriptionCopied').toString(),
  );
  // To exit invite a friend
  await clickOn(aliceWindow1, Global.backButton);
  // New message
  await clickOn(aliceWindow1, HomeScreen.newMessageOption);
  await clickOn(aliceWindow1, HomeScreen.newMessageAccountIDInput);
  const isMac = process.platform === 'darwin';
  await aliceWindow1.keyboard.press(`${isMac ? 'Meta' : 'Control'}+V`);
  await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
  // Did the copied text create note to self?
  await waitForTestIdWithText(
    aliceWindow1,
    Conversation.conversationHeader.selector,
    englishStrippedStr('noteToSelf').toString(),
  );
});

test_Alice_1W_no_network(
  'Hide note to self',
  async ({ aliceWindow1, alice }) => {
    await clickOn(aliceWindow1, HomeScreen.plusButton);
    await clickOn(aliceWindow1, HomeScreen.newMessageOption);
    await typeIntoInput(
      aliceWindow1,
      'new-session-conversation',
      alice.accountid,
    );
    await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
    await waitForTestIdWithText(
      aliceWindow1,
      Conversation.conversationHeader.selector,
      englishStrippedStr('noteToSelf').toString(),
    );
    await clickOnWithText(
      aliceWindow1,
      HomeScreen.conversationItemName,
      englishStrippedStr('noteToSelf').toString(),
      { rightButton: true },
    );
    await clickOnWithText(
      aliceWindow1,
      Global.contextMenuItem,
      englishStrippedStr('noteToSelfHide').toString(),
    );
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('noteToSelfHide').toString(),
      englishStrippedStr('noteToSelfHideDescription').toString(),
    );
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('hide').toString(),
    );
    await hasElementBeenDeleted(
      aliceWindow1,
      'data-testid',
      'module-conversation__user__profile-name',
      5000,
      englishStrippedStr('noteToSelf').toString(),
    );
  },
);

test_Alice_1W_no_network('Toggle password', async ({ aliceWindow1 }) => {
  await clickOn(aliceWindow1, LeftPane.settingsButton);
  await clickOn(aliceWindow1, Settings.recoveryPasswordMenuItem);
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.recoveryPasswordContainer.selector,
  );
  await clickOnMatchingText(
    aliceWindow1,
    englishStrippedStr('qrView').toString(),
  );
  // Wait for QR code to be visible
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.recoveryPasswordQRCode.selector,
  );
  // Then toggle back to text seed password
  await clickOnMatchingText(
    aliceWindow1,
    englishStrippedStr('recoveryPasswordView').toString(),
  );
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.recoveryPasswordContainer.selector,
  );
});

test_Alice_2W(
  'Consistent avatar colours',
  async ({ aliceWindow1, aliceWindow2 }) => {
    const avatarColors = await Promise.all(
      [aliceWindow1, aliceWindow2].map((w) =>
        w
          .locator('[data-testid="leftpane-primary-avatar"] > svg > g > circle')
          .getAttribute('fill'),
      ),
    );

    console.log('avatar1Color', avatarColors[0]);
    console.log('avatar2Color', avatarColors[1]);

    if (avatarColors[0] !== avatarColors[1]) {
      throw new Error('Avatar colours are not consistent');
    }
  },
);
