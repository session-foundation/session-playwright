import {
  base64_variants,
  from_string,
  to_base64,
} from 'libsodium-wrappers-sumo';
import { getSodiumNode } from '../../tests/sodium';
import {
  PubkeyType,
  SnodeSignatureResult,
  SnodeSigParamsShared,
  SnodeSigParamsUs,
  WithGetNow,
} from '../requests/types';

export function getVerificationDataForStoreRetrieve(
  params: SnodeSigParamsShared & WithGetNow,
) {
  const signatureTimestamp = params.getNow();
  const verificationString = `${params.method}${
    params.namespace === 0 ? '' : params.namespace
  }${signatureTimestamp}`;
  const verificationData = from_string(verificationString);
  return {
    toSign: new Uint8Array(verificationData),
    signatureTimestamp,
  };
}

async function getSnodeSignatureShared(params: SnodeSigParamsUs & WithGetNow) {
  const { signatureTimestamp, toSign } =
    getVerificationDataForStoreRetrieve(params);

  try {
    const sodium = await getSodiumNode();

    const signature = sodium.crypto_sign_detached(toSign, params.privKey);
    const signatureBase64 = to_base64(signature, base64_variants.ORIGINAL);

    return {
      timestamp: signatureTimestamp,
      signature: signatureBase64,
    };
  } catch (e: any) {
    throw e;
  }
}

export class UserSigner {
  private readonly ed25519PubKey: string;
  private readonly ed25519PrivKey: Uint8Array;
  public readonly sessionId: PubkeyType;

  constructor({
    ed25519PrivKey,
    ed25519PubKey,
    sessionId,
  }: {
    ed25519PubKey: string;
    ed25519PrivKey: Uint8Array;
    sessionId: PubkeyType;
  }) {
    this.ed25519PubKey = ed25519PubKey;
    if (this.ed25519PubKey.length !== 64) {
      console.warn('ed25519PubKey length', ed25519PubKey.length);
      throw new Error('ed25519PubKey not 64 long');
    }
    this.ed25519PrivKey = ed25519PrivKey;
    if (this.ed25519PrivKey.length !== 64) {
      console.warn('ed25519PrivKey length', ed25519PrivKey.length);
      throw new Error('ed25519PrivKey not 64 long');
    }
    this.sessionId = sessionId;
  }

  async getSnodeSignatureParams({
    method,
    namespace,
    getNow,
  }: Pick<SnodeSigParamsUs, 'method' | 'namespace'> &
    WithGetNow): Promise<SnodeSignatureResult> {
    if (!this.ed25519PrivKey || !this.ed25519PubKey) {
      const err = `getSnodeSignatureParams "${method}": User has no getUserED25519KeyPairBytes()`;
      throw new Error(err);
    }

    const sigData = await getSnodeSignatureShared({
      pubKey: this.sessionId,
      method,
      namespace,
      privKey: this.ed25519PrivKey,
      getNow,
    });

    return {
      ...sigData,
      pubkey_ed25519: this.ed25519PubKey,
      pubkey: this.sessionId,
    };
  }
}


