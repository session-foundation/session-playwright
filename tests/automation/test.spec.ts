import { buildStateForTest } from '@session-foundation/qa-seeder';
import { sleepFor } from '../promise_utils';
import { recoverFromSeed } from './setup/recovery_using_seed';
import { sessionTestThreeWindows } from './setup/sessionTest';
import { clickOnMatchingText } from './utilities/utils';

sessionTestThreeWindows('Tiny test', async (windows, testInfo) => {
  const [windowA] = windows;
  const prebuilt = await buildStateForTest('3friendsInGroup', testInfo.title);

  await Promise.all(
    windows.map((w, index) =>
      recoverFromSeed(w, prebuilt.users[index].seedPhrase),
    ),
  );

  await sleepFor(1000000);
  await clickOnMatchingText(windowA, 'Create Session ID');
});
