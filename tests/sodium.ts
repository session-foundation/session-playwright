import * as libSodiumWrappers from 'libsodium-wrappers-sumo';

export type LibSodiumType = typeof libSodiumWrappers;

export async function getSodiumNode() {
  await libSodiumWrappers.ready;
  return (libSodiumWrappers as any).default as LibSodiumType;
}

export type WithSodium = {
  sodium: LibSodiumType;
};
