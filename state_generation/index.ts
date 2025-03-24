import { sample } from 'lodash';
import { getSodiumNode, WithSodium } from '../tests/sodium';
import { randomSnodeOnUserSwarm } from './actions/fetchSwarmOf';

import { getAllSnodesFromSeed } from './requests/seedRequest';
import { loadSessionTools, WithSessionTools } from './sessionTools';
import { createRandomUser, SessionUser } from './sessionUser';
import { SessionGroup } from './sessionGroup';

function makeFriendsAndKnown(...users: Array<SessionUser>) {
  if (users.length < 2) {
    throw new Error('needs at least two users to make them friends');
  }
  users.forEach((user1, index) => {
    const user2 = users[index + 1];
    if (user2) {
      user1.contacts.setApproved(user2.sessionId, true);
      user1.contacts.setApprovedMe(user2.sessionId, true);
      user2.contacts.setApproved(user1.sessionId, true);
      user2.contacts.setApprovedMe(user1.sessionId, true);
      user2.contacts.setName(
        user1.sessionId,
        user1.userProfile.getName() || '',
      );
      user1.contacts.setName(
        user2.sessionId,
        user2.userProfile.getName() || '',
      );
    }
  });
}

function makeGroupWithMembers({
  members,
  groupName,
  sessionTools,
}: {
  members: Array<SessionUser>;
  groupName: string;
} & WithSessionTools) {
  return new SessionGroup({ sessionTools, groupName, members });
}

export function twoUsersFriends(opts: WithSodium & WithSessionTools) {
  const alice = createRandomUser(opts);
  const bob = createRandomUser(opts);
  makeFriendsAndKnown(alice, bob);
}

export async function prepareThreeFriendsInSharedGroup(groupName: string) {
  const sodium = await getSodiumNode();
  const sessionTools = await loadSessionTools();

  const alice = createRandomUser({ sodium, sessionTools });
  const bob = createRandomUser({ sodium, sessionTools });
  const charlie = createRandomUser({ sodium, sessionTools });
  const users = [alice, bob, charlie];

  try {
    alice.userProfile.setName('Alice');
    bob.userProfile.setName('Bob');
    charlie.userProfile.setName('Charlie');

    makeFriendsAndKnown(alice, bob, charlie);

    const group = makeGroupWithMembers({
      groupName,
      members: [alice, bob, charlie],
      sessionTools,
    });

    console.warn('creatorMetagroupW info:', group.metagroupW.makeInfoDumpHex());
    console.warn(
      'creatorMetagroupW members:',
      group.metagroupW.makeMembersDumpHex(),
    );

    const snodesInNetwork = await getAllSnodesFromSeed();

    const randomSnodeFromSeed = sample(snodesInNetwork);
    await Promise.all(
      users.map(async (user) => {
        const randomUserSnodeOnSwarm = await randomSnodeOnUserSwarm(
          user.sessionId,
          randomSnodeFromSeed,
        );
        await user.pushChangesToSwarm(randomUserSnodeOnSwarm);
      }),
    );

    const randomGroupSnodeOnSwarm = await randomSnodeOnUserSwarm(
      group.groupPk,
      randomSnodeFromSeed,
    );
    await group.pushChangesToSwarm(randomGroupSnodeOnSwarm);
    console.info(
      `seed of users:\n\t${users
        .map((u) => `"${u.userProfile.getName()}": "${u.seedPhrase}"`)
        .join('\n\t')} `,
    );
    return users.map((m) => ({
      seed: m.seed,
      seedPhrase: m.seedPhrase,
      sessionId: m.sessionId,
    }));
  } finally {
    users.map((user) => user.freeMemory());
  }
}
