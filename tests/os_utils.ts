import { release } from 'os';
import { isUndefined } from 'lodash';
import semver from 'semver';

export const isMacOS = () => process.platform === 'darwin';
export const isLinux = () => process.platform === 'linux';
export const isWindows = (minVersion?: string) => {
  const osRelease = release();

  if (process.platform !== 'win32') {
    return false;
  }

  return isUndefined(minVersion) ? true : semver.gte(osRelease, minVersion);
};
