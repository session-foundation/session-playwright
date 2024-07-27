import sessionToolsPromise, { MainModule } from 'session-tooling';

export async function loadSessionTools() {
  const loaded = await sessionToolsPromise();
  return loaded as MainModule;
}

export type WithSessionTools = {
  sessionTools: MainModule;
};
