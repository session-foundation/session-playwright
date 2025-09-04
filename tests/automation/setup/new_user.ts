import { Page } from '@playwright/test';
import chalk from 'chalk';

import {
  Global,
  HomeScreen,
  LeftPane,
  Onboarding,
  Settings,
} from '../locators';
import { User } from '../types/testing';
import {
  checkPathLight,
  clickOnTestIdWithText,
  grabTextFromElement,
  typeIntoInput,
  waitForTestIdWithText,
} from '../utilities/utils';

export const newUser = async (
  window: Page,
  userName: string,
  awaitOnionPath = true,
): Promise<User> => {
  // Create User
  await clickOnTestIdWithText(window, Onboarding.createAccountButton.selector);
  // Input username = testuser
  await typeIntoInput(window, Onboarding.displayNameInput.selector, userName);
  await clickOnTestIdWithText(window, Global.continueButton.selector);
  // save recovery phrase
  await clickOnTestIdWithText(
    window,
    HomeScreen.revealRecoveryPhraseButton.selector,
  );
  await waitForTestIdWithText(
    window,
    Settings.recoveryPasswordContainer.selector,
  );
  const recoveryPassword = await grabTextFromElement(
    window,
    'data-testid',
    'recovery-password-seed-modal',
  );
  // const recoveryPhrase = await window.innerText(
  //   '[data-testid=recovery-password-seed-modal]',
  // );
  await clickOnTestIdWithText(window, Global.modalCloseButton.selector);
  await clickOnTestIdWithText(window, LeftPane.profileButton.selector);

  // Save Account ID to a variable
  let accountid = await window.innerText(
    `[data-testid=${Settings.accountId.selector}]`,
  );
  accountid = accountid.replace(/[^0-9a-fA-F]/g, ''); // keep only hex characters

  console.log(
    `${userName}: Account ID: "${chalk.blue(
      accountid,
    )}" and Recovery password: "${chalk.green(recoveryPassword)}"`,
  );
  await clickOnTestIdWithText(window, Global.modalCloseButton.selector);
  if (awaitOnionPath) {
    await checkPathLight(window);
  }
  return { userName, accountid, recoveryPassword };
};
