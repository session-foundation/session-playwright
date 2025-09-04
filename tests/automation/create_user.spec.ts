import { sleepFor } from '../promise_utils';
import { Global, LeftPane, Settings } from './locators';
import { newUser } from './setup/new_user';
import { sessionTestOneWindow } from './setup/sessionTest';
import { clickOn, waitForTestIdWithText } from './utilities/utils';

sessionTestOneWindow('Create User', async ([window]) => {
  // Create User
  const userA = await newUser(window, 'Alice', false);
  // Open profile tab
  await clickOn(window, LeftPane.profileButton);
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
  await clickOn(window, Global.modalCloseButton);
  // go to settings section
  await clickOn(window, LeftPane.settingsButton);
  // check recovery phrase matches
  await clickOn(window, Settings.recoveryPasswordMenuItem);
  await waitForTestIdWithText(
    window,
    Settings.recoveryPasswordContainer.selector,
    userA.recoveryPassword,
  );
});
