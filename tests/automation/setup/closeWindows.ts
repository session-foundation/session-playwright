import { Page } from '@playwright/test';
import { execSync } from 'child_process';

import { sleepFor } from '../../promise_utils';
import { getTrackedElectronPids } from './open';

export const forceCloseAllWindows = async (windows: Array<Page>) => {
  await Promise.race([
    Promise.all(windows.map((w) => w.close())),
    sleepFor(4000),
  ]);

  // Also kill child processes
  const pids = getTrackedElectronPids();
  pids.forEach((pid) => {
    try {
      const killCommand =
        process.platform === 'win32'
          ? `taskkill /F /T /PID ${pid}` // /T kills child processes on Windows
          : `pkill -9 -P ${pid}; kill -9 ${pid}`; // Kill children then parent on Unix
      execSync(killCommand, { stdio: 'ignore' });
    } catch (e) {
      // This is fine - process already dead or doesn't exist
    }
  });
};
