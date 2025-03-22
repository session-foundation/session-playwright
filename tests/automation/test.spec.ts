import { prepareThreeFriendsInSharedGroup } from '../../state_generation';
import { sleepFor } from '../promise_utils';
import { recoverFromSeed } from './setup/recovery_using_seed';
import { sessionTestThreeWindows } from './setup/sessionTest';
import { clickOnMatchingText } from './utilities/utils';

sessionTestThreeWindows('Tiny test', async (windows) => {
  const [windowA, _windowB, _windowC] = windows;
  const prebuilt = await prepareThreeFriendsInSharedGroup();

  await Promise.all(
    windows.map((w, index) => recoverFromSeed(w, prebuilt[index].seedPhrase)),
  );

  await sleepFor(1000000);
  await clickOnMatchingText(windowA, 'Create Session ID');
});
