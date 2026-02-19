import { tStripped } from '../localization/lib';
import { Global, Onboarding } from './locators';
import { sessionTestOneWindow } from './setup/sessionTest';
import {
  checkModalStrings,
  clickOn,
  clickOnWithText,
  pasteIntoInput,
} from './utilities/utils';

sessionTestOneWindow('Warning modal new account', async ([aliceWindow1]) => {
  await clickOn(aliceWindow1, Onboarding.createAccountButton);
  await clickOn(aliceWindow1, Global.backButton);
  await checkModalStrings(
    aliceWindow1,
    tStripped('warning'),
    tStripped('onboardingBackAccountCreation'),
    'confirmModal',
  );
  await clickOnWithText(
    aliceWindow1,
    Global.confirmButton,
    tStripped('quitButton'),
  );
  // Wait for window to close (confirms restart was triggered)
  await aliceWindow1.waitForEvent('close', { timeout: 5000 });

  // Test ends - app is restarting but we can't verify the aftermath
  // Playwright cannot keep track of Electron's `window.restart` IPC call
  // so this will have to do
});

sessionTestOneWindow(
  'Warning modal restore account',
  async ([aliceWindow1]) => {
    const seedPhrase =
      'eldest fazed hybrid buzzer nasty domestic digit pager unusual purged makeup assorted domestic';
    await clickOn(aliceWindow1, Onboarding.iHaveAnAccountButton);
    await pasteIntoInput(aliceWindow1, 'recovery-phrase-input', seedPhrase);
    await clickOn(aliceWindow1, Global.continueButton);
    await clickOn(aliceWindow1, Global.backButton);
    await checkModalStrings(
      aliceWindow1,
      tStripped('warning'),
      tStripped('onboardingBackLoadAccount'),
      'confirmModal',
    );
    await clickOnWithText(
      aliceWindow1,
      Global.confirmButton,
      tStripped('quitButton'),
    );
    // Wait for window to close (confirms restart was triggered)
    await aliceWindow1.waitForEvent('close', { timeout: 5000 });

    // Test ends - app is restarting but we can't verify the aftermath
    // Playwright cannot keep track of Electron's `window.restart` IPC call
    // so this will have to do
  },
);
