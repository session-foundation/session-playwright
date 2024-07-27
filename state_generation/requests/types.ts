const prefixStandard = '05' as const;
const prefixGroup = '03' as const;

export type GroupPubkeyType = `${typeof prefixGroup}${string}`;
export type PubkeyType = `${typeof prefixStandard}${string}`;

export type SnodeSigParamsShared = {
  namespace: number | null | 'all'; // 'all' can be used to clear all namespaces (during account deletion)
  method: 'retrieve' | 'store' | 'delete_all';
};

export type SnodeSigParamsUs = SnodeSigParamsShared & {
  pubKey: string;
  privKey: Uint8Array; // len 64
};
export type WithGetNow = { getNow: () => number };
export type WithTimestamp = { timestamp: number };
export type WithSignature = { signature: string };
export type SnodeSignatureResult = WithSignature &
  WithTimestamp & {
    pubkey_ed25519: string;
    pubkey: string; // this is the x25519 key of the pubkey we are doing the request to (ourself for our swarm usually)
  };

export type SnodeFromSeed = {
  storage_port: number;
  public_ip: string;
};

export type Snode = {
  port: number;
  ip: string;
  pubkey_ed25519: string;
}