import { prepareThreeFriendsInSharedGroup } from '../../state_generation';
import { sleepFor } from '../promise_utils';
import { sessionTestOneWindow } from './setup/sessionTest';
import { clickOnMatchingText } from './utilities/utils';

sessionTestOneWindow('Tiny test', async ([windowA]) => {
  await prepareThreeFriendsInSharedGroup();
  await sleepFor(1000000);
  await clickOnMatchingText(windowA, 'Create Session ID');
});
