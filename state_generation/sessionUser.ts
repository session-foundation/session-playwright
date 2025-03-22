import type { ContactsW, UserGroupsW, UserProfileW } from 'session-tooling';
import { WithSodium } from '../tests/sodium';
import { PubkeyType, Snode } from './requests/types';
import { StoreUserConfigSubRequest } from './requests/snodeRequests';
import { from_hex, to_hex } from 'libsodium-wrappers-sumo';
import { UserSigner } from './signer/userSigner';
import { WithSessionTools } from './sessionTools';
import { mnDecode, mnEncode } from './mnemonic/mnemonic';

function buildUserSigner(user: SessionUser) {
  const userSigner = new UserSigner({
    sessionId: user.sessionId,
    ed25519PrivKey: user.ed25519Sk,
    ed25519PubKey: to_hex(user.ed25519Pk),
  });
  return userSigner;
}

function generateMnemonic(opts: WithSodium) {
  const seedSize = 16;
  const seed = opts.sodium.randombytes_buf(seedSize);
  const hex = to_hex(seed);
  return mnEncode(hex);
}

function mnemonixToRawSeed(mnemonic: string) {
  let seedHex = mnDecode(mnemonic);
  const privKeyHexLength = 32 * 2;
  if (seedHex.length !== privKeyHexLength) {
    seedHex = seedHex.concat('0'.repeat(32));
    seedHex = seedHex.substring(0, privKeyHexLength);
  }
  const seed = from_hex(seedHex);
  return seed;
}

export function sessionGenerateKeyPair(
  opts: WithSodium & { seed: ArrayBuffer },
) {
  const ed25519KeyPair = opts.sodium.crypto_sign_seed_keypair(
    new Uint8Array(opts.seed),
  );
  const x25519PublicKey = opts.sodium.crypto_sign_ed25519_pk_to_curve25519(
    ed25519KeyPair.publicKey,
  );
  // prepend version byte (coming from `processKeys(raw_keys)`)
  const origPub = new Uint8Array(x25519PublicKey);
  const prependedX25519PublicKey = new Uint8Array(33);
  prependedX25519PublicKey.set(origPub, 1);
  prependedX25519PublicKey[0] = 5;
  const x25519SecretKey = opts.sodium.crypto_sign_ed25519_sk_to_curve25519(
    ed25519KeyPair.privateKey,
  );

  // prepend with 05 the public key
  return {
    x25519PublicKeyWith05: prependedX25519PublicKey,
    x25519SecretKey: x25519SecretKey.buffer,
    ed25519KeyPair,
  };
}

export class SessionUser {
  public readonly sessionId: PubkeyType;
  public readonly ed25519Pk: Uint8Array;
  public readonly ed25519Sk: Uint8Array;
  public readonly seed: Uint8Array;
  public readonly seedPhrase: string;
  public readonly wrappers: Array<UserProfileW | ContactsW | UserGroupsW>;
  public readonly userProfile: UserProfileW;
  public readonly contacts: ContactsW;
  public readonly userGroups: UserGroupsW;
  public readonly userSigner: UserSigner;

  constructor({ sessionTools, sodium }: WithSessionTools & WithSodium) {
    const mnemonic = generateMnemonic({ sodium });
    const seed = mnemonixToRawSeed(mnemonic);
    const userKeys = sessionGenerateKeyPair({ seed, sodium });

    const userProfile = new sessionTools.UserProfileW(
      userKeys.ed25519KeyPair.privateKey,
      undefined,
    );
    const contacts = new sessionTools.ContactsW(
      userKeys.ed25519KeyPair.privateKey,
      undefined,
    );
    const userGroups = new sessionTools.UserGroupsW(
      userKeys.ed25519KeyPair.privateKey,
      undefined,
    );
    const wrappers = [userProfile, contacts, userGroups];

    this.sessionId = to_hex(userKeys.x25519PublicKeyWith05) as PubkeyType;
    this.ed25519Pk = userKeys.ed25519KeyPair.publicKey;
    this.ed25519Sk = userKeys.ed25519KeyPair.privateKey;
    this.seed = seed;
    this.seedPhrase = mnEncode(to_hex(seed).slice(0, 32));
    this.wrappers = wrappers;
    this.userProfile = userProfile;
    this.contacts = contacts;
    this.userGroups = userGroups;
    this.userSigner = buildUserSigner(this);
  }

  public async pushChangesToSwarm(snode: Snode) {
    const storeRequests = this.wrappers.map(
      (wrapper) =>
        new StoreUserConfigSubRequest({
          namespace: wrapper.storageNamespace().value,
          encryptedData: from_hex(wrapper.makePushHex()),
          sessionId: this.sessionId,
          ttlMs: 3600 * 24, // 1 day should be enough for testing and debugging a test?
          userSigner: this.userSigner,
        }),
    );

    const storeResult = await Promise.all(
      storeRequests.map(async (request) => {
        const builtRequest = await request.build();
        console.info(
          'storing to snode',
          `https://${snode.ip}:${snode.port}/storage_rpc/v1`,
        );
        const ret = await fetch(
          `https://${snode.ip}:${snode.port}/storage_rpc/v1`,
          {
            body: JSON.stringify(builtRequest),
            method: 'POST',
          },
        );
        return ret.status;
      }),
    );
    console.warn(`storeStatus for ${this.userProfile.getName()}:`, storeResult);
  }

  public freeMemory() {
    this.wrappers.map((wrapper) => wrapper.delete());
  }
}

export function createRandomUser(details: WithSodium & WithSessionTools) {
  return new SessionUser(details);
}
