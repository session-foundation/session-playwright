import { LeftPane, Settings } from './locators';
import { newUser } from './setup/new_user';
import { sessionTestOneWindow } from './setup/sessionTest';
import { clickOn, waitForTestIdWithText } from './utilities/utils';

function validateNetworkData(data: any): asserts data is {
  price: { usd: number; usd_market_cap: number };
  token: { staking_reward_pool: number };
} {
  if (
    typeof data?.price?.usd !== 'number' ||
    typeof data?.token?.staking_reward_pool !== 'number' ||
    typeof data?.price?.usd_market_cap !== 'number'
  ) {
    throw new Error('Network API response missing or invalid numeric fields');
  }
}

sessionTestOneWindow('Network page values', async ([aliceWindow1]) => {
  await newUser(aliceWindow1, 'Alice');
  await clickOn(aliceWindow1, LeftPane.settingsButton);
  await clickOn(aliceWindow1, Settings.networkPageMenuItem);

  const response = await fetch('http://networkv1.getsession.org/info');
  if (!response.ok) {
    throw new Error(`Network API returned ${response.status}`);
  }
  const data = await response.json();
  validateNetworkData(data);

  // SESH Price - 2 decimals
  const seshPrice = `$${data.price.usd.toFixed(2)} USD`;

  // Staking Reward Pool - whole number with commas
  const stakingRewardPool = `${data.token.staking_reward_pool.toLocaleString(
    'en-US',
  )} SESH`;

  // Market Cap - round to whole number with commas
  const marketCap = `$${Math.round(data.price.usd_market_cap).toLocaleString(
    'en-US',
  )} USD`;

  await waitForTestIdWithText(aliceWindow1, 'sent-price', seshPrice);
  await waitForTestIdWithText(
    aliceWindow1,
    'staking-reward-pool-amount',
    stakingRewardPool,
  );
  await waitForTestIdWithText(aliceWindow1, 'market-cap-amount', marketCap);
});
