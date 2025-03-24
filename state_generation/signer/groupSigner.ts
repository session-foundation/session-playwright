import {
  base64_variants,
  from_string,
  to_base64,
} from 'libsodium-wrappers-sumo';
import { getSodiumNode } from '../../tests/sodium';
import {
  SnodeSignatureResult,
  SnodeSigParamsShared,
  SnodeSigParamsUs,
  WithGetNow,
  type GroupPubkeyType,
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

export class GroupAdminSigner {
  public readonly groupPk: GroupPubkeyType;
  private readonly groupSecretKey: Uint8Array;

  constructor({
    groupSecretKey,
    groupPk,
  }: {
    groupSecretKey: Uint8Array;
    groupPk: GroupPubkeyType;
  }) {
    this.groupSecretKey = groupSecretKey;
    if (this.groupSecretKey.length !== 64) {
      console.warn('groupSecretKey length', groupSecretKey.length);
      throw new Error('groupSecretKey not 64 long');
    }
    this.groupPk = groupPk;
  }

  async getSnodeSignatureParams({
    method,
    namespace,
    getNow,
  }: Pick<SnodeSigParamsUs, 'method' | 'namespace'> &
    WithGetNow): Promise<SnodeSignatureResult> {
    const sigData = await getSnodeSignatureShared({
      pubKey: this.groupPk,
      method,
      namespace,
      privKey: this.groupSecretKey,
      getNow,
    });

    return {
      ...sigData,
      pubkey: this.groupPk,
    };
  }
}
