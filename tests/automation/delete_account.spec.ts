import { Page } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import { sleepFor } from '../promise_utils';
import { Global, HomeScreen, LeftPane, Onboarding, Settings } from './locators';
import { forceCloseAllWindows } from './setup/closeWindows';
import { newUser } from './setup/new_user';
import { openApp } from './setup/open';
import { recoverFromSeed } from './setup/recovery_using_seed';
import { sessionTestTwoWindows } from './setup/sessionTest';
import { createContact } from './utilities/create_contact';
import { sendNewMessage } from './utilities/send_message';
import {
  clickOn,
  clickOnElement,
  clickOnMatchingText,
  clickOnWithText,
  hasElementBeenDeleted,
  typeIntoInput,
  waitForElement,
  waitForLoadingAnimationToFinish,
} from './utilities/utils';

sessionTestTwoWindows(
  'Delete account from swarm',
  async ([windowA, windowB]) => {
    let restoringWindows: Array<Page> | undefined;
    try {
      const [userA, userB] = await Promise.all([
        newUser(windowA, 'Alice'),
        newUser(windowB, 'Bob'),
      ]);
      const testMessage = `${userA.userName} to ${userB.userName}`;
      const testReply = `${userB.userName} to ${userA.userName}`;
      // Create contact and send new message
      await Promise.all([
        sendNewMessage(windowA, userB.accountid, testMessage),
        sendNewMessage(windowB, userA.accountid, testReply),
      ]);
      // Delete all data from device
      // Click on settings tab
      await clickOn(windowA, LeftPane.settingsButton);
      // Click on clear all data
      await clickOnWithText(
        windowA,
        Settings.clearDataMenuItem,
        englishStrippedStr('sessionClearData').toString(),
      );
      // Select entire account
      await clickOnWithText(
        windowA,
        Settings.clearDeviceAndNetworkRadial,
        englishStrippedStr('clearDeviceAndNetwork').toString(),
      );
      // Confirm deletion by clicking Clear, twice
      await clickOnMatchingText(
        windowA,
        englishStrippedStr('clear').toString(),
      );
      await clickOnMatchingText(
        windowA,
        englishStrippedStr('clear').toString(),
      );
      await waitForLoadingAnimationToFinish(windowA, 'loading-spinner');
      // await sleepFor(7500);
      // Wait for window to close and reopen

      // await windowA.close();
      restoringWindows = await openApp(1); // not using sessionTest here as we need to close and reopen one of the window
      const [restoringWindow] = restoringWindows;
      // Sign in with deleted account and check that nothing restores
      await clickOn(
        restoringWindow,
        Onboarding.iHaveAnAccountButton,
      );
      // Fill in recovery phrase
      await typeIntoInput(
        restoringWindow,
        Onboarding.recoveryPhraseInput.selector,
        userA.recoveryPassword,
      );
      // Enter display name
      await clickOn(
        restoringWindow,
        Global.continueButton,
      );
      await waitForLoadingAnimationToFinish(
        restoringWindow,
        'loading-animation',
      );

      await typeIntoInput(
        restoringWindow,
        Onboarding.displayNameInput.selector,
        userA.userName,
      );
      // Click continue
      await clickOn(
        restoringWindow,
        Global.continueButton,
      );
      await sleepFor(5000, true); // just to allow any messages from our swarm to show up

      // Need to verify that no conversation is found at all

      await hasElementBeenDeleted(
        restoringWindow,
        'data-testid',
        HomeScreen.conversationItemName.selector,
      );

      await clickOn(
        restoringWindow,
        HomeScreen.plusButton,
      ); // Expect contacts list to be empty

      await hasElementBeenDeleted(
        restoringWindow,
        'data-testid',
        Global.contactItem.selector,
        10000,
      );
    } finally {
      if (restoringWindows) {
        await forceCloseAllWindows(restoringWindows);
      }
    }
  },
);

sessionTestTwoWindows(
  'Delete account from device',
  async ([windowA, windowB]) => {
    let restoringWindows: Array<Page> | undefined;
    try {
      const [userA, userB] = await Promise.all([
        newUser(windowA, 'Alice'),
        newUser(windowB, 'Bob'),
      ]);
      // Create contact and send new message
      await createContact(windowA, windowB, userA, userB);
      // Delete all data from device
      // Click on settings tab
      await clickOn(windowA, LeftPane.settingsButton);
      // Click on clear all data
      await clickOnWithText(
        windowA,
        Settings.clearDataMenuItem,
        englishStrippedStr('sessionClearData').toString(),
      );
      // Keep 'Clear Device only' selection
      // Confirm deletion by clicking Clear, twice
      await clickOnMatchingText(
        windowA,
        englishStrippedStr('clear').toString(),
      );
      await clickOnMatchingText(
        windowA,
        englishStrippedStr('clear').toString(),
      );
      await waitForLoadingAnimationToFinish(windowA, 'loading-spinner');
      // Wait for window to close and reopen
      // await windowA.close();
      restoringWindows = await openApp(1);
      const [restoringWindow] = restoringWindows;
      // Sign in with deleted account and check that nothing restores
      await recoverFromSeed(restoringWindow, userA.recoveryPassword);
      await sleepFor(5000, true); // just to allow any messages from our swarm to show up
      // Check if message from user B is restored
      await waitForElement(
        restoringWindow,
        'data-testid',
        HomeScreen.conversationItemName.selector,
        10000,
        userB.userName,
      );
      // Check if contact is available in contacts section
      await clickOnElement({
        window: restoringWindow,
        strategy: 'data-testid',
        selector: HomeScreen.plusButton.selector,
      });
      await waitForElement(
        restoringWindow,
        'data-testid',
        Global.contactItem.selector,
        1000,
        userB.userName,
      );
      console.log('Contacts have been restored');
    } finally {
      if (restoringWindows) {
        await forceCloseAllWindows(restoringWindows);
      }
    }
  },
);
