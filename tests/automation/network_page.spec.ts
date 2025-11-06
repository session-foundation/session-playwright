import { englishStrippedStr } from '../localization/englishStrippedStr';
import { sleepFor } from '../promise_utils';
import { Global, LeftPane, Settings } from './locators';
import { test_Alice_1W } from './setup/sessionTest';
import { validateNetworkData } from './utilities/network_api';
import {
  assertUrlIsReachable,
  checkModalStrings,
  clickOn,
  waitForLoadingAnimationToFinish,
  waitForTestIdWithText,
} from './utilities/utils';

test_Alice_1W('Network page values', async ({ aliceWindow1 }) => {
  await clickOn(aliceWindow1, LeftPane.settingsButton);
  await clickOn(aliceWindow1, Settings.networkPageMenuItem);

  const response = await fetch('http://networkv1.getsession.org/info');
  if (!response.ok) {
    throw new Error(`Network API returned ${response.status}`);
  }
  const data = await response.json();
  validateNetworkData(data);

  // SESH Price - 2 decimals "$1.23 USD"
  const seshPrice = `$${data.price.usd.toFixed(2)} USD`;

  // Staking Reward Pool - whole number with commas "1,234,567 SESH"
  const stakingRewardPool = `${data.token.staking_reward_pool.toLocaleString(
    'en-US',
  )} SESH`;

  // Market Cap - round to whole number with commas, "$1,234,567 USD"
  const marketCap = `$${Math.round(data.price.usd_market_cap).toLocaleString(
    'en-US',
  )} USD`;

  await waitForTestIdWithText(
    aliceWindow1,
    Settings.seshPrice.selector,
    seshPrice,
  );
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.stakingRewardPoolAmount.selector,
    stakingRewardPool,
  );
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.marketCapAmount.selector,
    marketCap,
  );
});

test_Alice_1W('Network page network link', async ({ aliceWindow1 }) => {
  const url = 'https://docs.getsession.org/session-network';
  await clickOn(aliceWindow1, LeftPane.settingsButton);
  await clickOn(aliceWindow1, Settings.networkPageMenuItem);
  await clickOn(aliceWindow1, Settings.learnMoreNetworkLink);
  await checkModalStrings(
    aliceWindow1,
    englishStrippedStr('urlOpen').toString(),
    englishStrippedStr('urlOpenDescription').withArgs({ url }).toString(),
    'openUrlModal',
  );
  await assertUrlIsReachable(url);
});

test_Alice_1W('Network page staking link', async ({ aliceWindow1 }) => {
  const url = 'https://docs.getsession.org/session-network/staking';
  await clickOn(aliceWindow1, LeftPane.settingsButton);
  await clickOn(aliceWindow1, Settings.networkPageMenuItem);
  await clickOn(aliceWindow1, Settings.learnMoreAboutStakingLink);
  await checkModalStrings(
    aliceWindow1,
    englishStrippedStr('urlOpen').toString(),
    englishStrippedStr('urlOpenDescription').withArgs({ url }).toString(),
    'openUrlModal',
  );
  await assertUrlIsReachable(url);
});

test_Alice_1W('Network page refresh', async ({ aliceWindow1 }) => {
  const zeroMinAgoText = englishStrippedStr('updated')
    .withArgs({ relative_time: '0m' })
    .toString();
  const oneMinAgoText = englishStrippedStr('updated')
    .withArgs({ relative_time: '1m' })
    .toString();
  await clickOn(aliceWindow1, LeftPane.settingsButton);
  await clickOn(aliceWindow1, Settings.networkPageMenuItem);
  await waitForLoadingAnimationToFinish(
    aliceWindow1,
    Global.loadingSpinner.selector,
  );
  await sleepFor(65_000); // Wait 60+5 seconds to ensure timestamp changes to "1m ago"
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.lastUpdatedTimestamp.selector,
    oneMinAgoText,
  );
  await clickOn(aliceWindow1, Settings.refreshButton);
  await waitForLoadingAnimationToFinish(
    aliceWindow1,
    Global.loadingSpinner.selector,
  );
  await waitForTestIdWithText(
    aliceWindow1,
    Settings.lastUpdatedTimestamp.selector,
    zeroMinAgoText,
  );
});
