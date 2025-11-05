import { englishStrippedStr } from '../localization/englishStrippedStr';
import { Global, Onboarding } from './locators';
import { sessionTestOneWindow } from './setup/sessionTest';
import {
  checkModalStrings,
  clickOn,
  clickOnWithText,
  typeIntoInput,
} from './utilities/utils';

sessionTestOneWindow(
  'Warning modal new account',
  async ([aliceWindow1]) => {
    // Create User
    await clickOn(aliceWindow1, Onboarding.createAccountButton);
    // Need to implement a back button on Desktop
    await clickOn(aliceWindow1, Global.backButton);
    //  Expect modal to appear with warning message
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('warning').toString(),
      englishStrippedStr('onboardingBackAccountCreation').toString(),
        'confirmModal',
    );
    await clickOnWithText(aliceWindow1, Global.confirmButton, englishStrippedStr('quitButton').toString());
    // Wait for window to close (confirms restart was triggered)
    await aliceWindow1.waitForEvent('close', { timeout: 5000 });

    // Test ends - app is restarting but we can't verify the aftermath
    // Playwright cannot keep track of Electron's `window.restart` IPC call
    // so this will have to do 
  },
);

sessionTestOneWindow(
  'Warning modal restore account',
  async ([aliceWindow1]) => {
    const seedPhrase =
      'eldest fazed hybrid buzzer nasty domestic digit pager unusual purged makeup assorted domestic';
    // Restore user
    await clickOn(aliceWindow1, Onboarding.iHaveAnAccountButton);
    // Input recovery phrase
    await typeIntoInput(aliceWindow1, 'recovery-phrase-input', seedPhrase);
    // Click continue to go to loading page
    await clickOn(aliceWindow1, Global.continueButton);
    // Need to implement a back button on Desktop
    await clickOn(aliceWindow1, Global.backButton);
    // Expect modal to appear with warning message
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('warning').toString(),
      englishStrippedStr('onboardingBackLoadAccount').toString(),
      'confirmModal',
    );
    await clickOnWithText(aliceWindow1, Global.confirmButton, englishStrippedStr('quitButton').toString());
    // Wait for window to close (confirms restart was triggered)
    await aliceWindow1.waitForEvent('close', { timeout: 5000 });

    // Test ends - app is restarting but we can't verify the aftermath
    // Playwright cannot keep track of Electron's `window.restart` IPC call
    // so this will have to do 
  },
);