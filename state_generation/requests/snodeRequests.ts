import { base64_variants, to_base64 } from 'libsodium-wrappers-sumo';
import { isEmpty } from 'lodash';
import { UserSigner } from '../signer/userSigner';
import { GroupPubkeyType, PubkeyType, WithGetNow } from './types';
import type { GroupAdminSigner } from '../signer/groupSigner';

export class SwarmForSubRequest {
  public method = 'get_swarm' as const;
  public readonly pubkey;

  constructor(pubkey: PubkeyType | GroupPubkeyType) {
    this.pubkey = pubkey;
  }

  public async build() {
    return {
      method: this.method,
      params: {
        pubkey: this.pubkey,
        params: {
          active_only: true,
          fields: {
            public_ip: true,
            storage_port: true,
            pubkey_x25519: true,
            pubkey_ed25519: true,
          },
        },
      },
    } as const;
  }

  public loggingId(): string {
    return `${this.method}`;
  }
}

export class StoreUserSubRequest {
  public method = 'store' as const;
  public readonly namespace: number;
  private readonly signer: UserSigner;
  getNow: () => number;

  constructor({
    namespace,
    userSigner,
    getNow,
  }: WithGetNow & {
    namespace: number;
    userSigner: UserSigner;
  }) {
    this.namespace = namespace;
    this.signer = userSigner;
    this.getNow = getNow;
  }

  public async build() {
    const { pubkey, pubkey_ed25519, signature, timestamp } =
      await this.signer.getSnodeSignatureParams({
        method: this.method,
        namespace: this.namespace,
        getNow: this.getNow,
      });

    return {
      method: this.method,
      params: {
        namespace: this.namespace,
        pubkey,
        pubkey_ed25519,
        signature,
        timestamp, // we give a timestamp to force verification of the signature provided
      },
    };
  }

  public async toBody(): Promise<string> {
    return JSON.stringify(await this.build());
  }
  public loggingId(): string {
    return `${this.method}`;
  }
}

export class StoreUserConfigSubRequest {
  public method = 'store' as const;
  public readonly namespace: number;
  public readonly ttlMs: number;
  public readonly encryptedData: Uint8Array;
  public readonly destination: PubkeyType;
  public readonly userSigner: UserSigner;

  constructor(args: {
    namespace: number;
    ttlMs: number;
    encryptedData: Uint8Array;
    sessionId: PubkeyType;
    userSigner: UserSigner;
  }) {
    this.namespace = args.namespace;
    this.ttlMs = args.ttlMs;
    this.encryptedData = args.encryptedData;
    this.destination = args.sessionId;
    this.userSigner = args.userSigner;

    if (isEmpty(this.encryptedData)) {
      throw new Error('this.encryptedData cannot be empty');
    }

    if (isEmpty(this.destination)) {
      throw new Error('this.destination cannot be empty');
    }
  }

  public async build() {
    const encryptedDataBase64 = to_base64(
      this.encryptedData,
      base64_variants.ORIGINAL,
    );

    const signDetails = await this.userSigner.getSnodeSignatureParams({
      getNow: () => Date.now(),
      method: this.method,
      namespace: this.namespace,
    });

    if (!signDetails) {
      throw new Error(
        `[StoreUserConfigSubRequest] signing returned an empty result`,
      );
    }

    const toRet = {
      method: this.method,
      params: {
        namespace: this.namespace,
        ttl: this.ttlMs,
        data: encryptedDataBase64,
        ...signDetails,
      },
    };

    return toRet;
  }

  public loggingId(): string {
    return `${this.method}-${this.destination}-${this.namespace}`;
  }

  public getDestination() {
    return this.destination;
  }
}

export class StoreGroupConfigSubRequest {
  public method = 'store' as const;
  public readonly namespace: number;
  public readonly ttlMs: number;
  public readonly encryptedData: Uint8Array;
  public readonly destination: GroupPubkeyType;
  public readonly adminGroupSigner: GroupAdminSigner;

  constructor(args: {
    namespace: number;
    ttlMs: number;
    encryptedData: Uint8Array;
    groupPk: GroupPubkeyType;
    adminGroupSigner: GroupAdminSigner;
  }) {
    this.namespace = args.namespace;
    this.ttlMs = args.ttlMs;
    this.encryptedData = args.encryptedData;
    this.destination = args.groupPk;
    this.adminGroupSigner = args.adminGroupSigner;

    if (isEmpty(this.encryptedData)) {
      throw new Error('this.encryptedData cannot be empty');
    }

    if (isEmpty(this.destination)) {
      throw new Error('this.destination cannot be empty');
    }
  }

  public async build() {
    const encryptedDataBase64 = to_base64(
      this.encryptedData,
      base64_variants.ORIGINAL,
    );

    const signDetails = await this.adminGroupSigner.getSnodeSignatureParams({
      getNow: () => Date.now(),
      method: this.method,
      namespace: this.namespace,
    });

    if (!signDetails) {
      throw new Error(
        `[StoreGroupConfigSubRequest] signing returned an empty result`,
      );
    }

    const toRet = {
      method: this.method,
      params: {
        namespace: this.namespace,
        ttl: this.ttlMs,
        data: encryptedDataBase64,
        ...signDetails,
      },
    };

    return toRet;
  }

  public loggingId(): string {
    return `${this.method}-${this.destination}-${this.namespace}`;
  }

  public getDestination() {
    return this.destination;
  }
}
