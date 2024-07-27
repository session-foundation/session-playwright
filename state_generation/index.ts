import { sample } from 'lodash';
import { getSodiumNode, WithSodium } from '../tests/sodium';
import { randomSnodeOnUserSwarm } from './actions/fetchSwarmOf';

import { getAllSnodesFromSeed } from './requests/seedRequest';
import { PubkeyType } from './requests/types';
import { loadSessionTools, WithSessionTools } from './sessionTools';
import { createRandomUser, SessionUser } from './sessionUser';

function createRandomLegacyGroup({ sodium }: WithSodium) {
  const seed = sodium.randombytes_buf(sodium.crypto_sign_ed25519_SEEDBYTES);
  const ed25519KeyPair = sodium.crypto_sign_seed_keypair(seed);
  const privkeyHex = sodium.to_hex(ed25519KeyPair.privateKey);

  // 64 privkey + 64 pubkey
  const publicKey = sodium.crypto_sign_ed25519_sk_to_pk(
    sodium.from_hex(privkeyHex),
  );
  const x25519Pk = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

  const encKeypair = sodium.crypto_sign_keypair();
  const groupPubkey = new Uint8Array(33);
  groupPubkey.set(x25519Pk, 1);
  groupPubkey[0] = 5;

  const groupPk = sodium.to_hex(groupPubkey) as PubkeyType;
  return {
    groupPk,
    encPk: encKeypair.publicKey,
    encSk: encKeypair.privateKey,
  };
}
// type CreatedLegacyGroup = ReturnType<typeof createRandomLegacyGroup>;

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
  sodium,
}: {
  members: Array<SessionUser>;
  groupName: string;
} & WithSodium) {
  // first one is the creator
  if (!members.length) {
    throw new Error('Excepted at least one creator/member');
  }
  const [creator, ...otherMembers] = members;
  const { encPk, encSk, groupPk } = createRandomLegacyGroup({ sodium });
  const legacyGroup = creator.userGroups.getOrConstructLegacyGroup(groupPk);
  legacyGroup.name = groupName;
  legacyGroup.encPubkey = encPk;
  legacyGroup.encSeckey = encSk;
  legacyGroup.insert(creator.sessionId, true);
  otherMembers.forEach((member) => {
    legacyGroup.insert(member.sessionId, false); // only one admin for legacy groups
  });

  [creator, ...otherMembers].forEach((member) => {
    member.userGroups.setLegacyGroup(legacyGroup);
  });
}

export function twoUsersFriends(opts: WithSodium & WithSessionTools) {
  const alice = createRandomUser(opts);
  const bob = createRandomUser(opts);
  makeFriendsAndKnown(alice, bob);
}

export async function prepareThreeFriendsInSharedGroup() {
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

    makeGroupWithMembers({
      groupName: 'group test 1',
      members: [alice, bob, charlie],
      sodium,
    });

    const snodesInNetwork = await getAllSnodesFromSeed();

    const randomSnodeFromSeed = sample(snodesInNetwork);
    await Promise.all(
      users.map(async (user) => {
        const randomSnodeOnSwarm = await randomSnodeOnUserSwarm(
          user.sessionId,
          randomSnodeFromSeed,
        );
        await user.pushChangesToSwarm(randomSnodeOnSwarm);
      }),
    );
    console.warn(`seed of alice: "${users[0].seedPhrase}"`);
    return users.map((m) => ({ seed: m.seed, sessionId: m.sessionId }));
  } finally {
    users.map((user) => user.freeMemory());
  }
}
