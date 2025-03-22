// test integration are always on testnet on desktop
const testNet = true;

const seedNode = testNet
  ? { ip: 'seed2.getsession.org', port: 38157 }
  : { ip: 'storage.seed1.loki.network', port: 4433 };

export async function getAllSnodesFromSeed() {
  const getAll = new GetSnodesFromSeed();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    const result = await fetch(
      `http${testNet ? '' : 's'}://${seedNode.ip}:${seedNode.port}/json_rpc`,
      {
        body: JSON.stringify(getAll.build()),
        method: 'POST',
      },
    );

    const json = await result.json();
    console.warn('getAllSnodesFromSeed json:', json);

    return json.result.service_node_states;
  } catch (e) {
    console.warn(e);
    throw e;
  }
}

class GetSnodesFromSeed {
  public build() {
    return {
      jsonrpc: '2.0',
      id: '0',
      method: 'get_n_service_nodes',
      params: {
        active_only: true,
        limit: 20,
        fields: {
          public_ip: true,
          storage_port: true,
          pubkey_x25519: true,
          pubkey_ed25519: true,
        },
      },
    };
  }
}
