import { Page } from '@playwright/test';

import { sleepFor } from '../promise_utils';
import { test_Alice_1W_no_network } from './setup/sessionTest';
import {
  clickOnMatchingText,
  clickOnTestIdWithText,
  hasElementPoppedUpThatShouldnt,
  typeIntoInput,
  waitForTestIdWithText,
} from './utilities/utils';
import { englishStrippedStr } from '../localization/englishStrippedStr';
import { Global, LeftPane, Settings } from './locators';

const testPassword = '123456';
const newTestPassword = '789101112';

async function expectRecoveryPhraseToBeVisible(
  window: Page,
  recoveryPhrase: string,
) {
  await waitForTestIdWithText(
    window,
    Settings.recoveryPasswordContainer.selector,
    recoveryPhrase,
    1000,
  );
}

test_Alice_1W_no_network('Set Password', async ({ alice, aliceWindow1 }) => {
  // Click on settings tab
  await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector);
  // Click on privacy
  await clickOnTestIdWithText(aliceWindow1, Settings.privacyMenuItem.selector);
  // Click set password
  await clickOnTestIdWithText(aliceWindow1, Settings.setPasswordSettingsButton.selector);
  // Enter password
  await typeIntoInput(aliceWindow1, Settings.passwordInput.selector, testPassword);
  // Confirm password
  await typeIntoInput(aliceWindow1, Settings.confirmPasswordInput.selector, testPassword);
  await clickOnTestIdWithText(aliceWindow1, Settings.setPasswordButton.selector)
  // Check toast notification
  await waitForTestIdWithText(
    aliceWindow1,
    Global.toast.selector,
    englishStrippedStr('passwordSetDescriptionToast').toString(),
  );
  // Click on settings tab
  await sleepFor(300, true);
  await clickOnTestIdWithText(aliceWindow1, Global.modalCloseButton.selector);
  await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector);
  await clickOnTestIdWithText(
    aliceWindow1,
    Settings.recoveryPasswordMenuItem.selector,
  );
  await sleepFor(300, true);

  // Type password into input field and validate it
  await typeIntoInput(aliceWindow1, Settings.passwordInput.selector, testPassword);
  // Click Done
  await clickOnMatchingText(
    aliceWindow1,
    englishStrippedStr('enter').toString(),
  );

  // check that the seed is visible now
  await expectRecoveryPhraseToBeVisible(aliceWindow1, alice.recoveryPassword);
  await clickOnTestIdWithText(aliceWindow1, Global.modalCloseButton.selector);
  await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector);
  await clickOnTestIdWithText(aliceWindow1, Settings.privacyMenuItem.selector)
  // Change password
  await clickOnTestIdWithText(aliceWindow1, Settings.changePasswordSettingsButton.selector);

  // Enter old password
  await typeIntoInput(aliceWindow1, Settings.passwordInput.selector, testPassword);
  // Enter new password
  await typeIntoInput(aliceWindow1, Settings.confirmPasswordInput.selector, newTestPassword);
  // Confirm new password
  await typeIntoInput(
    aliceWindow1,
    Settings.reConfirmPasswordInput.selector,
    newTestPassword,
  );
  // Press enter on keyboard
  await aliceWindow1.keyboard.press('Enter');
  // Check toast notification for 'changed password'
  await waitForTestIdWithText(
    aliceWindow1,
    Global.toast.selector,
    englishStrippedStr('passwordChangedDescriptionToast').toString(),
  );
});

test_Alice_1W_no_network(
  'Wrong Password',
  async ({ alice: { recoveryPassword }, aliceWindow1 }) => {
    // Check if incorrect password works
    // Click on settings tab
    await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector);
    // Click on privacy
    await clickOnTestIdWithText(
      aliceWindow1,
      Settings.privacyMenuItem.selector,
    );
    // Click set password
    await clickOnTestIdWithText(aliceWindow1, Settings.setPasswordSettingsButton.selector);
    // Enter password
    await typeIntoInput(aliceWindow1, Settings.passwordInput.selector, testPassword);
    // Confirm password
    await typeIntoInput(aliceWindow1, Settings.confirmPasswordInput.selector, testPassword);
    await clickOnTestIdWithText(aliceWindow1, Settings.setPasswordButton.selector)
    // Click on recovery phrase tab
    await sleepFor(5000);

    // Click on settings tab
    await clickOnTestIdWithText(aliceWindow1, Global.modalCloseButton.selector);
    await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector); 
    await clickOnTestIdWithText(
      aliceWindow1,
      Settings.recoveryPasswordMenuItem.selector,
    );
    // Type password into input field
    await typeIntoInput(aliceWindow1, Settings.passwordInput.selector, testPassword);
    // Confirm the password
    await clickOnTestIdWithText(aliceWindow1, Global.confirmButton.selector);
    // this should print the recovery phrase
    await expectRecoveryPhraseToBeVisible(aliceWindow1, recoveryPassword);

    //  Click on settings tab
    await clickOnTestIdWithText(aliceWindow1, Global.modalCloseButton.selector);
    await clickOnTestIdWithText(aliceWindow1, LeftPane.settingsButton.selector); 
    await sleepFor(500);
    // Click on recovery phrase tab
    await clickOnTestIdWithText(
      aliceWindow1,
      Settings.recoveryPasswordMenuItem.selector,
    );
    // Try with incorrect password
    await typeIntoInput(aliceWindow1, Settings.passwordInput.selector, newTestPassword);
    // Confirm the password
    await clickOnTestIdWithText(aliceWindow1, Global.confirmButton.selector);
    // this should NOT print the recovery phrase

    await hasElementPoppedUpThatShouldnt(
      aliceWindow1,
      'data-testid',
      Settings.recoveryPasswordContainer.selector,
      recoveryPassword,
    );

    //  Incorrect password below input showing?
    await waitForTestIdWithText(
      aliceWindow1,
      Global.errorMessage.selector,
      englishStrippedStr('passwordIncorrect').toString(),
    );
    await clickOnTestIdWithText(aliceWindow1, Global.modalCloseButton.selector);
    await sleepFor(100);
    // Click on recovery phrase tab
    await clickOnTestIdWithText(
      aliceWindow1,
      Settings.recoveryPasswordMenuItem.selector,
    );
    //  No password entered
    await clickOnTestIdWithText(aliceWindow1, Global.confirmButton.selector);
    //  Banner should ask for password to be entered
    await waitForTestIdWithText(
      aliceWindow1,
      Global.errorMessage.selector,
      englishStrippedStr('passwordIncorrect').toString(),
    );
  },
);
