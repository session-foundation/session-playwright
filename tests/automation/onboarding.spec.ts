import { englishStrippedStr } from '../locale/localizedString';
import { test_Alice_1W_no_network } from './setup/sessionTest';
import {
  checkModalStrings,
  clickOnTestIdWithText,
  typeIntoInput,
  waitForTestIdWithText,
} from './utilities/utils';

test_Alice_1W_no_network(
  'Warning modal new account',
  async ({ aliceWindow1 }) => {
    // Create User
    await clickOnTestIdWithText(aliceWindow1, 'create-account-button');
    // Need to implement a back button on Desktop
    await clickOnTestIdWithText(aliceWindow1, 'back-button');
    //  Expect modal to appear with warning message
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('warning').toString(),
      englishStrippedStr('onboardingBackAccountCreation').toString(),
    );
    await clickOnTestIdWithText(
      aliceWindow1,
      'session-confirm-ok-button',
      englishStrippedStr('quit').toString(),
    );
    // Should reload page and take you back to create account page
    await waitForTestIdWithText(aliceWindow1, 'create-account-button');
  },
);

test_Alice_1W_no_network(
  'Warning modal restore account',
  async ({ aliceWindow1 }) => {
    const seedPhrase =
      'eldest fazed hybrid buzzer nasty domestic digit pager unusual purged makeup assorted domestic';
    // Restore user
    await clickOnTestIdWithText(aliceWindow1, 'existing-account-button');
    // Input recovery phrase
    await typeIntoInput(aliceWindow1, 'recovery-phrase-input', seedPhrase);
    // Click continue to go to loading page
    await clickOnTestIdWithText(aliceWindow1, 'continue-button');
    // Need to implement a back button on Desktop
    await clickOnTestIdWithText(aliceWindow1, 'back-button');
    // Expect modal to appear with warning message
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('warning').toString(),
      englishStrippedStr('onboardingBackLoadAccount').toString(),
    );
    // Should reload page and take you back to create account page
    await waitForTestIdWithText(aliceWindow1, 'create-account-button');
  },
);
