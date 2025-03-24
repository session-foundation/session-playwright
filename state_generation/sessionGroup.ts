import type { MetaGroupW } from 'session-tooling';
import type { GroupPubkeyType, Snode } from './requests/types';
import type { WithSessionTools } from './sessionTools';
import type { SessionUser } from './sessionUser';
import { from_hex } from 'libsodium-wrappers-sumo';
import { GroupAdminSigner } from './signer/groupSigner';
import { compact } from 'lodash';
import { StoreGroupConfigSubRequest } from './requests/snodeRequests';

function buildGroupSigner(group: SessionGroup) {
  if (!group.groupSecretKey) {
    throw new Error(
      'only group admin signer (with admin key) is supported currently',
    );
  }
  return new GroupAdminSigner({
    groupPk: group.groupPk,
    groupSecretKey: group.groupSecretKey,
  });
}

export class SessionGroup {
  public readonly groupPk: GroupPubkeyType;
  public readonly groupSecretKey?: Uint8Array;

  public readonly metagroupW: MetaGroupW;
  public readonly adminGroupSigner: GroupAdminSigner;

  constructor({
    sessionTools,
    groupName,
    members,
  }: { members: Array<SessionUser>; groupName: string } & WithSessionTools) {
    // first one is the creator
    if (!members.length) {
      throw new Error('Excepted at least one creator/member');
    }
    const [creator, ...otherMembers] = members;
    const newGroup = creator.userGroups.createGroup();
    newGroup.name = groupName;
    newGroup.joinedAtSeconds = Math.floor(Date.now() / 1000);

    [creator, ...otherMembers].forEach((member) => {
      member.userGroups.setGroup(newGroup);
    });

    this.metagroupW = new sessionTools.MetaGroupW(
      creator.ed25519Sk,
      from_hex(newGroup.groupPk.toString().slice(2)).buffer,
      from_hex(newGroup.adminSecretKey.toString()),
      undefined,
    );

    this.metagroupW.setNameTruncated(groupName);

    [creator, ...otherMembers].map((u) => {
      const member = this.metagroupW.membersGetOrConstruct(u.sessionId);
      if (u.sessionId === creator.sessionId) {
        member.setPromotionAccepted();
      } else {
        member.setInviteAccepted();
      }
      member.setNameTruncated(u.userProfile.getName()?.toString() || '');

      this.metagroupW.membersSet(member);
    });

    this.groupPk = newGroup.groupPk.toString() as GroupPubkeyType;
    this.adminGroupSigner = buildGroupSigner(this);
  }

  public async pushChangesToSwarm(snode: Snode) {
    const pushHex = this.metagroupW.pushHex();
    const toPush = compact([
      pushHex.keysPush,
      pushHex.membersPush,
      pushHex.infosPush,
    ]);

    const storeRequests = toPush.map((m) => {
      return new StoreGroupConfigSubRequest({
        namespace: m.storageNamespace.value,
        encryptedData: from_hex(m.dataHex.toString()),
        groupPk: this.groupPk,
        ttlMs: 3600 * 24, // 1 day should be enough for testing and debugging a test?
        adminGroupSigner: this.adminGroupSigner,
      });
    });

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
    console.warn(`storeStatus for (group) ${this.groupPk}:`, storeResult);
  }

  public freeMemory() {
    this.metagroupW.delete();
  }
}
