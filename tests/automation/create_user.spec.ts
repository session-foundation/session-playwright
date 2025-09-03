import { sleepFor } from '../promise_utils';
import { newUser } from './setup/new_user';
import { sessionTestOneWindow } from './setup/sessionTest';
import {
  clickOnTestIdWithText,
  waitForTestIdWithText,
} from './utilities/utils';
import { Global, LeftPane, Settings } from './locators';

sessionTestOneWindow('Create User', async ([window]) => {
  // Create User
  const userA = await newUser(window, 'Alice', false);
  // Open profile tab
  await clickOnTestIdWithText(window, LeftPane.profileButton.selector);
  await sleepFor(100, true);
  // check username matches
  await waitForTestIdWithText(
    window,
    Settings.displayName.selector,
    userA.userName,
  );
  // check Account ID matches
  await waitForTestIdWithText(
    window,
    Settings.accountId.selector,
    userA.accountid,
  );
  // exit profile modal
  await clickOnTestIdWithText(window, Global.modalCloseButton.selector);
  // go to settings section
  await clickOnTestIdWithText(window, LeftPane.settingsButton.selector);
  // check recovery phrase matches
  await clickOnTestIdWithText(
    window,
    Settings.recoveryPasswordMenuItem.selector,
  );
  await waitForTestIdWithText(
    window,
    Settings.recoveryPasswordContainer.selector,
    userA.recoveryPassword,
  );
});
