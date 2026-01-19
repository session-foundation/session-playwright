/* eslint-disable no-await-in-loop */
import { Page } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import { sleepFor } from '../promise_utils';
import {
  Conversation,
  Global,
  HomeScreen,
  LeftPane,
  Settings,
} from './locators';
import { forceCloseAllWindows } from './setup/closeWindows';
import { newUser } from './setup/new_user';
import {
  sessionTestOneWindow,
  test_Alice_2W,
  test_Alice_2W_Bob_1W,
} from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import { linkedDevice } from './utilities/linked_device';
import { sendMessage } from './utilities/message';
import { compareElementScreenshot } from './utilities/screenshot';
import {
  checkModalStrings,
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  clickOnTextMessage,
  clickOnWithText,
  doWhileWithMax,
  hasElementBeenDeleted,
  hasTextMessageBeenDeleted,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
  waitForMatchingPlaceholder,
  waitForMatchingText,
  waitForTestIdWithText,
  waitForTextMessage,
} from './utilities/utils';

sessionTestOneWindow('Link a device', async ([aliceWindow1]) => {
  let aliceWindow2: Page | undefined;
  try {
    const userA = await newUser(aliceWindow1, 'Alice');
    aliceWindow2 = await linkedDevice(userA.recoveryPassword); // not using fixture here as we want to check the behavior finely
    await clickOn(aliceWindow1, LeftPane.profileButton);
    // Verify Username
    await waitForTestIdWithText(
      aliceWindow1,
      Settings.displayName.selector,
      userA.userName,
    );
    // Verify Account ID
    await waitForTestIdWithText(
      aliceWindow1,
      Settings.accountId.selector,
      userA.accountid,
    );
    // exit profile modal
    await clickOn(aliceWindow1, Global.modalCloseButton);
    // You're almost finished isn't displayed
    const errorDesc = 'Should not be found';
    try {
      const elemShouldNotBeFound = aliceWindow2.locator(
        '[data-testid=reveal-recovery-phrase]',
      );
      if (elemShouldNotBeFound) {
        console.error(
          'Continue to save recovery phrase not found, excellent news',
        );
        throw new Error(errorDesc);
      }
    } catch (e) {
      if (e.message !== errorDesc) {
        // this is NOT ok
        throw e;
      }
    }
  } finally {
    if (aliceWindow2) {
      await forceCloseAllWindows([aliceWindow2]);
    }
  }
});

test_Alice_2W(
  'Changed username syncs',
  async ({ aliceWindow1, aliceWindow2 }) => {
    const newUsername = 'Tiny bubble';
    await clickOn(aliceWindow1, LeftPane.profileButton);
    // Click on pencil icon
    await clickOn(aliceWindow1, Settings.displayName);
    // Replace old username with new username
    await typeIntoInput(
      aliceWindow1,
      Settings.displayNameInput.selector,
      newUsername,
    );
    // Press enter to confirm change
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('save').toString(),
    );

    // Check username change in window B
    // Click on profile settings in window B
    // Waiting for the username to change
    await doWhileWithMax(
      15000,
      500,
      'waiting for updated username in profile dialog',
      async () => {
        await clickOn(aliceWindow2, LeftPane.profileButton);
        // Verify username has changed to new username
        try {
          await waitForTestIdWithText(
            aliceWindow2,
            Settings.displayName.selector,
            newUsername,
            100,
          );
          return true;
        } catch (e) {
          // if waitForTestIdWithText doesn't find the right username, close the window and retry
          return false;
        } finally {
          await clickOnElement({
            window: aliceWindow2,
            strategy: 'data-testid',
            selector: 'modal-close-button',
          });
        }
      },
    );
  },
);

test_Alice_2W(
  'Profile picture syncs',
  async ({ aliceWindow1, aliceWindow2 }) => {
    await clickOn(aliceWindow1, LeftPane.profileButton);
    // Click on current profile picture
    await clickOn(aliceWindow1, Settings.displayName);
    await clickOn(aliceWindow1, Settings.imageUploadSection);
    await clickOn(aliceWindow1, Settings.imageUploadClick);
    // allow for the image to be resized before we try to save it
    await sleepFor(500);
    await clickOn(aliceWindow1, Settings.saveProfileUpdateButton);
    await waitForLoadingAnimationToFinish(
      aliceWindow1,
      Global.loadingSpinner.selector,
    );
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('save').toString(),
    );
    await clickOn(aliceWindow1, Global.modalCloseButton);

    const leftpaneAvatarContainer = await waitForTestIdWithText(
      aliceWindow2,
      LeftPane.profileButton.selector,
    );

    await compareElementScreenshot({
      element: leftpaneAvatarContainer,
      snapshotName: 'avatar-updated-blue.jpeg',
    });
  },
);

test_Alice_2W_Bob_1W(
  'Contacts syncs',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    // linked device (aliceWindow2)
    await waitForTestIdWithText(
      aliceWindow2,
      'module-conversation__user__profile-name',
      bob.userName,
    );
    console.info('Contacts correctly synced');
  },
);

test_Alice_2W_Bob_1W(
  'Deleted message syncs',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    const messageToDelete = 'Testing deletion functionality for linked device';
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendMessage(aliceWindow1, messageToDelete);
    // Navigate to conversation on linked device and for message from user A to user B
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      bob.userName,
    );
    await Promise.all([
      waitForTextMessage(aliceWindow2, messageToDelete),
      waitForTextMessage(bobWindow1, messageToDelete),
    ]);
    await clickOnTextMessage(aliceWindow1, messageToDelete, true);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('delete').toString(),
    );
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      englishStrippedStr('delete').toString(),
    );
    await waitForTestIdWithText(
      aliceWindow1,
      'session-toast',
      englishStrippedStr('deleteMessageDeleted')
        .withArgs({ count: 1 })
        .toString(),
    );
    await hasTextMessageBeenDeleted(aliceWindow1, messageToDelete, 6_000);
    // linked device for deleted message
    // Waiting for message to be removed
    // Check for linked device
    await hasTextMessageBeenDeleted(aliceWindow2, messageToDelete, 30_000);
    // Still should exist for user B
    await waitForMatchingText(bobWindow1, messageToDelete);
  },
);

test_Alice_2W_Bob_1W(
  'Unsent message syncs',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    const unsentMessage = 'Testing unsending functionality for linked device';
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendMessage(aliceWindow1, unsentMessage);
    // Navigate to conversation on linked device and for message from user A to user B
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      bob.userName,
    );
    await Promise.all([
      waitForTextMessage(aliceWindow2, unsentMessage),
      waitForTextMessage(bobWindow1, unsentMessage),
    ]);
    await clickOnTextMessage(aliceWindow1, unsentMessage, true);
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('delete').toString(),
    );
    await clickOnMatchingText(
      aliceWindow1,
      englishStrippedStr('clearMessagesForEveryone').toString(),
    );
    await clickOnElement({
      window: aliceWindow1,
      strategy: 'data-testid',
      selector: 'session-confirm-ok-button',
    });
    await waitForTestIdWithText(
      aliceWindow1,
      'session-toast',
      englishStrippedStr('deleteMessageDeleted')
        .withArgs({ count: 1 })
        .toString(),
    );
    await hasTextMessageBeenDeleted(aliceWindow1, unsentMessage, 1000);
    await waitForMatchingText(
      bobWindow1,
      englishStrippedStr('deleteMessageDeletedGlobally').toString(),
    );
    // linked device for deleted message
    await hasTextMessageBeenDeleted(aliceWindow2, unsentMessage, 5_000);
  },
);

test_Alice_2W_Bob_1W(
  'Blocked user syncs',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    const testMessage = 'Testing blocking functionality for linked device';

    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await sendMessage(aliceWindow1, testMessage);
    // Navigate to conversation on linked device and check for message from user A to user B
    await clickOnWithText(
      aliceWindow2,
      HomeScreen.conversationItemName,
      bob.userName,
      { rightButton: true },
    );
    // Select block
    await clickOnWithText(
      aliceWindow2,
      Global.contextMenuItem,
      englishStrippedStr('block').toString(),
    );
    // Check modal strings
    await checkModalStrings(
      aliceWindow2,
      englishStrippedStr('block').toString(),
      englishStrippedStr('blockDescription')
        .withArgs({ name: bob.userName })
        .toString(),
    );
    await clickOnWithText(
      aliceWindow2,
      Global.confirmButton,
      englishStrippedStr('block').toString(),
    );
    // Verify the user was moved to the blocked contact list
    await waitForMatchingPlaceholder(
      aliceWindow1,
      Conversation.messageInput.selector,
      englishStrippedStr('blockBlockedDescription').toString(),
    );
    // Check linked device for blocked contact in settings screen
    // Click on settings tab
    await clickOn(aliceWindow2, LeftPane.settingsButton);
    await clickOn(aliceWindow2, Settings.conversationsMenuItem);
    // a conf sync job can take 30s (if the last one failed) +  10s polling to show a change on a linked device.
    await clickOn(aliceWindow2, Settings.blockedContactsButton, {
      maxWait: 50_000,
    });
    // Check if user B is in blocked contact list
    await waitForTestIdWithText(
      aliceWindow2,
      Global.contactItem.selector,
      bob.userName,
    );
  },
);

test_Alice_2W_Bob_1W(
  'Deleted conversation syncs',
  async ({ alice, aliceWindow1, aliceWindow2, bob, bobWindow1 }) => {
    // Create contact and send new message
    await createContact(aliceWindow1, bobWindow1, alice, bob);
    await clickOn(bobWindow1, Global.backButton);
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1].map((w) =>
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
      waitForTestIdWithText(
        aliceWindow2,
        Global.contactItem.selector,
        bob.userName,
      ),
    ]);
    await Promise.all(
      [aliceWindow1, aliceWindow2, bobWindow1].map((w) =>
        clickOn(w, Global.backButton),
      ),
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
    // Need to wait for deletion to propagate to linked device
    await Promise.all(
      [aliceWindow1, aliceWindow2].map((w) =>
        hasElementBeenDeleted(
          w,
          'data-testid',
          HomeScreen.conversationItemName.selector,
          10_000,
          bob.userName,
        ),
      ),
    );
  },
);

test_Alice_2W(
  'Hide note to self syncs',
  async ({ alice, aliceWindow1, aliceWindow2 }) => {
    await clickOn(aliceWindow1, HomeScreen.plusButton);
    await clickOn(aliceWindow1, HomeScreen.newMessageOption);
    await typeIntoInput(
      aliceWindow1,
      HomeScreen.newMessageAccountIDInput.selector,
      alice.accountid,
    );
    await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
    await waitForTestIdWithText(
      aliceWindow1,
      'header-conversation-name',
      englishStrippedStr('noteToSelf').toString(),
    );
    await sendMessage(aliceWindow1, 'Testing note to self');
    // Check if note to self is visible in linked device
    await sleepFor(1000);
    await waitForTestIdWithText(
      aliceWindow2,
      HomeScreen.conversationItemName.selector,
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
    // Check linked device for hidden note to self
    await sleepFor(1000);
    await Promise.all([
      hasElementBeenDeleted(
        aliceWindow1,
        'data-testid',
        HomeScreen.conversationItemName.selector,
        5000,
        englishStrippedStr('noteToSelf').toString(),
      ),
      hasElementBeenDeleted(
        aliceWindow2,
        'data-testid',
        HomeScreen.conversationItemName.selector,
        15_000,
        englishStrippedStr('noteToSelf').toString(),
      ),
    ]);
  },
);
