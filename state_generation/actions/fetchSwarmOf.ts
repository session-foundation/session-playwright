import { isEmpty, sample } from 'lodash';
import { SwarmForSubRequest } from '../requests/snodeRequests';
import { PubkeyType, Snode, SnodeFromSeed } from '../requests/types';

const fetchedSwarms: Record<PubkeyType, Array<Snode>> = {};

async function getSwarmOfUser(sessionId: PubkeyType, snode: SnodeFromSeed) {
  const swarmRequest = new SwarmForSubRequest(sessionId);

  const swarmResult = await fetch(
    `https://${snode.public_ip}:${snode.storage_port}/storage_rpc/v1`,
    {
      body: JSON.stringify(await swarmRequest.build()),
      method: 'POST',
    },
  );
  const swarm = await swarmResult.json();

  if (isEmpty(fetchedSwarms[sessionId])) {
    fetchedSwarms[sessionId] = swarm;
  }
  // console.error('fetched userSwarm', swarm.snodes);

  return swarm.snodes;
}

export async function randomSnodeOnUserSwarm(
  sessionId: PubkeyType,
  snode: SnodeFromSeed,
) {
  const userSwarm =
    fetchedSwarms[sessionId] || (await getSwarmOfUser(sessionId, snode));
  const randomSnodeOnSwarm = sample(userSwarm);
  if (!randomSnodeOnSwarm) {
    throw new Error(`did not find a snode for user: ${sessionId}`);
  }
  console.info(
    `random snode for user: ${sessionId} is snode: ${randomSnodeOnSwarm.pubkey_ed25519}`,
  );
  return randomSnodeOnSwarm;
}
