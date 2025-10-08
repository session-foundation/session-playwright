import { Onboarding } from './locators';
import { sessionTestOneWindow } from './setup/sessionTest';
import { clickOn } from './utilities/utils';

sessionTestOneWindow('Tiny test', async ([windowA]) => {
  await clickOn(windowA, Onboarding.createAccountButton);
});
