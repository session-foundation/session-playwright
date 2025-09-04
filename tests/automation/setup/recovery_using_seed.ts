import { Page } from '@playwright/test';

import { Global, Onboarding } from '../locators';
import {
  clickOn,
  doesElementExist,
  typeIntoInput,
  waitForLoadingAnimationToFinish,
} from '../utilities/utils';

export async function recoverFromSeed(window: Page, recoveryPhrase: string) {
  await clickOn(window, Onboarding.iHaveAnAccountButton);
  await typeIntoInput(window, 'recovery-phrase-input', recoveryPhrase);
  await clickOn(window, Global.continueButton);
  await waitForLoadingAnimationToFinish(window, 'loading-animation');
  const displayName = await doesElementExist(
    window,
    'data-testid',
    'display-name-input',
  );
  if (displayName) {
    throw new Error(`Display name was not found when restoring from seed`);
  }

  return { window };
}
