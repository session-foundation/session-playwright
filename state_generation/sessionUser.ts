import type { Contacts, UserGroups, UserProfile } from 'session-tooling';
import { WithSodium } from '../tests/sodium';
import { PubkeyType, Snode } from './requests/types';
import { StoreUserConfigSubRequest } from './requests/snodeRequests';
import { from_hex, to_hex } from 'libsodium-wrappers-sumo';
import { UserSigner } from './signer/userSigner';
import { WithSessionTools } from './sessionTools';
import { mnEncode } from './mnemonic/mnemonic';

function buildUserSigner(user: SessionUser) {
  const userSigner = new UserSigner({
    sessionId: user.sessionId,
    ed25519PrivKey: user.ed25519Sk,
    ed25519PubKey: to_hex(user.ed25519Pk),
  });
  return userSigner;
}

export class SessionUser {
  public readonly sessionId: PubkeyType;
  public readonly ed25519Pk: Uint8Array;
  public readonly ed25519Sk: Uint8Array;
  public readonly seed: Uint8Array;
  public readonly seedPhrase: string;
  public readonly wrappers: Array<UserProfile | Contacts | UserGroups>;
  public readonly userProfile: UserProfile;
  public readonly contacts: Contacts;
  public readonly userGroups: UserGroups;
  public readonly userSigner: UserSigner;

  constructor(
    { sessionTools, sodium }: WithSessionTools & WithSodium,
    seed: Uint8Array,
  ) {
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
    const userProfile = new sessionTools.UserProfile(
      ed25519KeyPair.privateKey,
      undefined,
    );
    const contacts = new sessionTools.Contacts(
      ed25519KeyPair.privateKey,
      undefined,
    );
    const userGroups = new sessionTools.UserGroups(
      ed25519KeyPair.privateKey,
      undefined,
    );
    const wrappers = [userProfile, contacts, userGroups];

    this.sessionId = sessionId;
    this.ed25519Pk = ed25519KeyPair.publicKey;
    this.ed25519Sk = ed25519KeyPair.privateKey;
    this.seed = seed;
    this.seedPhrase = mnEncode(to_hex(seed));
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

    const storeStatus = await Promise.all(
      storeRequests.map(async (request) => {
        const builtRequest = await request.build();
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
    console.warn(`storeStatus for ${this.userProfile.getName()}:`, storeStatus);
  }

  public freeMemory() {
    this.wrappers.map((wrapper) => wrapper.delete());
  }
}

export function createRandomUser(details: WithSodium & WithSessionTools) {
  const seed = details.sodium.randombytes_buf(
    details.sodium.crypto_sign_ed25519_SEEDBYTES,
  );

  return new SessionUser(details, seed);
}
