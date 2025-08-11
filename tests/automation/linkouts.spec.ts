import { Page } from '@playwright/test';

import { englishStrippedStr } from '../localization/englishStrippedStr';
import { test_Alice_1W_no_network } from './setup/sessionTest';
import {
  assertUrlIsReachable,
  checkModalStrings,
  clickOnTestIdWithText,
} from './utilities/utils';

[
  {
    name: 'Donate linkout',
    url: 'https://session.foundation/donate#app',
    trigger: async (window: Page) => {
      await clickOnTestIdWithText(window, 'donate-settings-menu-item');
    },
  },
  {
    name: 'Network page learn more linkout',
    url: 'https://docs.getsession.org/session-network',
    trigger: async (window: Page) => {
      await clickOnTestIdWithText(window, 'session-network-settings-menu-item');
      await clickOnTestIdWithText(window, 'learn-more-network-link');
    },
  },
  {
    name: 'Network page staking linkout',
    url: 'https://docs.getsession.org/session-network/staking',
    trigger: async (window: Page) => {
      await clickOnTestIdWithText(window, 'session-network-settings-menu-item');
      await clickOnTestIdWithText(window, 'learn-about-staking-link');
    },
  },
].forEach(({ name, url, trigger }) => {
  test_Alice_1W_no_network(name, async ({ aliceWindow1 }) => {
    await clickOnTestIdWithText(aliceWindow1, 'settings-section');
    await trigger(aliceWindow1);

    // Check the modal appears with correct content
    await checkModalStrings(
      aliceWindow1,
      englishStrippedStr('urlOpen').toString(),
      englishStrippedStr('urlOpenDescription').withArgs({ url }).toString(),
    );

    // Verify the URL is reachable
    await assertUrlIsReachable(url);
  });
});
