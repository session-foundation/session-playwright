import { sessionTestOneWindow } from './setup/sessionTest';
import { clickOnTestIdWithText } from './utilities/utils';

import plop, { MainModule } from 'session-tooling';
import { LibSodiumType, getSodiumNode } from '../sodium';

type PubkeyType = string;

sessionTestOneWindow('Tiny test', async ([windowA]) => {
  await clickOnTestIdWithText(windowA, 'create-account-button');
  await plop();
  const libsession = await plop();
  console.time('threeFriendsInSharedGroup');
  await threeFriendsInSharedGroup(libsession);
  console.timeEnd('threeFriendsInSharedGroup');
});

function createRandomLegacyGroup({ sodium }: { sodium: LibSodiumType }) {
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

function createRandomUser({
  sodium,
  libsession,
}: {
  sodium: LibSodiumType;
  libsession: MainModule;
}) {
  const seed = sodium.randombytes_buf(sodium.crypto_sign_ed25519_SEEDBYTES);
  const ed25519KeyPair = sodium.crypto_sign_seed_keypair(seed);
  const privkeyHex = sodium.to_hex(ed25519KeyPair.privateKey);

  // 64 privkey + 64 pubkey
  const publicKey = sodium.crypto_sign_ed25519_sk_to_pk(
    sodium.from_hex(privkeyHex),
  );
  const x25519PublicKey =
    sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);

  const sessId = new Uint8Array(33);
  sessId.set(x25519PublicKey, 1);
  sessId[0] = 5;
  const sessionId = sodium.to_hex(sessId) as PubkeyType;
  const { UserProfile, Contacts, UserGroups } = libsession;
  const userProfile = new UserProfile(ed25519KeyPair.privateKey, undefined);
  const contacts = new Contacts(ed25519KeyPair.privateKey, undefined);
  const userGroups = new UserGroups(ed25519KeyPair.privateKey, undefined);
  return {
    sessionId,
    ed25519Pk: ed25519KeyPair.publicKey,
    ed25519Sk: ed25519KeyPair.privateKey,
    seed,
    // wrappers
    userProfile,
    contacts,
    userGroups,
    // cleanup: release memory of those objects
    delete: () => {
      userProfile.delete();
      contacts.delete();
      userGroups.delete();
    },
  };
}
type SessionUser = Awaited<ReturnType<typeof createRandomUser>>;

function makeFriends(alice: SessionUser, bob: SessionUser) {
  alice.contacts.setApproved(bob.sessionId, true);
  alice.contacts.setApprovedMe(bob.sessionId, true);
  bob.contacts.setApproved(alice.sessionId, true);
  bob.contacts.setApprovedMe(alice.sessionId, true);
}

function makeGroupWithMembers({
  members,
  groupName,
  sodium,
}: {
  members: Array<SessionUser>;
  groupName: string;
  sodium: LibSodiumType;
}) {
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

function getMergedDumps({
  user,
  sodium,
}: {
  user: SessionUser;
  sodium: LibSodiumType;
}) {
  const seedHex = sodium.to_hex(user.seed);

  return `seed:${seedHex};profile:${user.userProfile.makeDumpHex()};contacts:${user.contacts.makeDumpHex()};userGroups:${user.userGroups.makeDumpHex()}`;
}

async function threeFriendsInSharedGroup(libsession: MainModule) {
  console.time('total');
  const sodium = await getSodiumNode();

  const alice = createRandomUser({ sodium, libsession });
  const bob = createRandomUser({ sodium, libsession });
  const charlie = createRandomUser({ sodium, libsession });

  try {
    alice.userProfile.setName('Alice');
    bob.userProfile.setName('Bob');
    charlie.userProfile.setName('Charlie');

    makeFriends(alice, bob);
    makeFriends(alice, charlie);
    makeFriends(bob, charlie);

    makeGroupWithMembers({
      groupName: 'group test 1',
      members: [alice, bob, charlie],
      sodium,
    });

    const dumpsAliceMerged = getMergedDumps({
      user: alice,
      sodium,
    });
    const dumpsBobMerged = getMergedDumps({
      user: bob,
      sodium,
    });
    const dumpsCharlieMerged = getMergedDumps({
      user: charlie,
      sodium,
    });
    console.log('dumpsAliceMerged', dumpsAliceMerged);
    console.log('dumpsBobMerged', dumpsBobMerged);
    console.log('dumpsCharlieMerged', dumpsCharlieMerged);
  } finally {
    alice.delete();
    bob.delete();
    charlie.delete();
    console.timeEnd('total');
  }
}
