import { _electron as electron } from '@playwright/test';
import chalk from 'chalk';
import { isEmpty } from 'lodash';
import { join } from 'path';
import { v4 } from 'uuid';

const logNodeConsole = process.env.LOG_NODE_CONSOLE === '1';

export const NODE_ENV = 'production';
export const MULTI_PREFIX = 'test-integration-';
const multisAvailable = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let electronPids: Array<number> = [];

export type TestContext = {
  dbCreationTimestampMs?: number;
  networkPageNodeCount?: number;
};

export function getAppRootPath() {
  if (isEmpty(process.env.SESSION_DESKTOP_ROOT)) {
    throw new Error(
      "You need to set the 'config.SESSION_DESKTOP_ROOT' in your .env file",
    );
  }
  return process.env.SESSION_DESKTOP_ROOT as string;
}

function mockDbCreationTimestamp(dbCreationTimestampMs?: number) {
  if (dbCreationTimestampMs !== undefined) {
    process.env.DB_CREATION_TIMESTAMP_MS = String(dbCreationTimestampMs);
    const humanReadable = new Date(dbCreationTimestampMs).toLocaleString(
      'en-AU',
    );
    console.info(
      `   DB Creation Timestamp: ${process.env.DB_CREATION_TIMESTAMP_MS} (${humanReadable})`,
    );
  } else {
    delete process.env.DB_CREATION_TIMESTAMP_MS;
  }
}

function mockNetworkPageNodeCount(networkPageNodeCount?: number) {
  if (networkPageNodeCount !== undefined) {
    if (networkPageNodeCount < 1 || networkPageNodeCount > 10) {
      throw new Error(
        `networkPageNodeCount must be between 1 and 10, got ${networkPageNodeCount}`,
      );
    }
    process.env.SESSION_MOCK_NETWORK_PAGE_NODE_COUNT =
      String(networkPageNodeCount);
    console.info(
      `   Network Page Node Count: ${process.env.SESSION_MOCK_NETWORK_PAGE_NODE_COUNT}`,
    );
  } else {
    delete process.env.SESSION_MOCK_NETWORK_PAGE_NODE_COUNT;
  }
}

const openElectronAppOnly = async (multi: string, context?: TestContext) => {
  process.env.MULTI = `${multi}`;
  // using a v4 uuid, as timestamps to the ms are sometimes the same (when a bunch of workers are started)
  const uniqueId = v4();
  process.env.NODE_APP_INSTANCE = `${MULTI_PREFIX}-devprod-${uniqueId}-${process.env.MULTI}`;
  process.env.NODE_ENV = NODE_ENV;

  // Inject custom env vars if provided
  mockDbCreationTimestamp(context?.dbCreationTimestampMs);
  mockNetworkPageNodeCount(context?.networkPageNodeCount);

  console.info(
    `   LOCAL_DEVNET_SEED_URL: ${process.env.LOCAL_DEVNET_SEED_URL}`,
  );
  console.info(`   NON CI RUN`);
  console.info('   NODE_ENV', process.env.NODE_ENV);
  console.info('   NODE_APP_INSTANCE', process.env.NODE_APP_INSTANCE);

  try {
    const electronApp = await electron.launch({
      args: [
        join(getAppRootPath(), 'app', 'ts', 'mains', 'main_node.js'),
        '--disable-gpu',
        '--force-device-scale-factor=1', // Normalizes Retina and non-Retina mac screens
      ],
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: '1',
        // Optional: control log level
        ELECTRON_LOG_LEVEL: 'verbose', // or 'info', 'warn', 'error'
      },
    });

    if (logNodeConsole) {
      electronApp.on('console', (msg) => {
        const text = msg.text();

        // if (text.includes('[QUERY PLAN]')) {
        console.log(`[FROM NODE ${msg.type()}]:`, text);
        // }
      });
    }

    // When a test closes a window on purpose,
    // the restarted app is considered a child process of the original electronApp.
    // However Playwright only tracks the original processes.
    // In order to close all Electron windows during teardown
    // we need to keep track of the opened PIDs.
    const pid = electronApp.process()?.pid;
    if (pid) {
      electronPids.push(pid);
    }

    return electronApp;
  } catch (e) {
    console.info(
      chalk.redBright(
        `failed to start electron app with error: ${e.message}`,
        e,
      ),
    );
    throw e;
  }
};

const logBrowserConsole = process.env.LOG_BROWSER_CONSOLE === '1';

const openAppAndWait = async (multi: string, context?: TestContext) => {
  const electronApp = await openElectronAppOnly(multi, context);
  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow();
  window.on('console', (msg) => {
    if (!logBrowserConsole) {
      return;
    }
    if (msg.type() === 'error') {
      console.log(chalk.grey(`FROM BROWSER: Error "${msg.text()}"`));
    } else {
      console.log(chalk.grey(`FROM BROWSER: ${msg.text()}`));
    }
  });
  return window;
};

export async function openApp(windowsToCreate: number, context?: TestContext) {
  if (windowsToCreate >= multisAvailable.length) {
    throw new Error(`Do you really need ${multisAvailable.length} windows?!`);
  }
  // if windowToCreate = 3, this array will be ABC. If windowToCreate = 5, this array will be ABCDE
  const multisToUse = multisAvailable.slice(0, windowsToCreate);

  const array = [...multisToUse];
  const toRet = [];
  // not too sure why, but launching those windows with Promise.all triggers a sqlite error...
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    // eslint-disable-next-line no-await-in-loop
    const openedWindow = await openAppAndWait(`${element}`, context);
    toRet.push(openedWindow);
  }
  console.log(
    chalk.bgRedBright(`Pathway to app: `, process.env.SESSION_DESKTOP_ROOT),
  );
  return toRet;
}

export function getTrackedElectronPids(): Array<number> {
  return electronPids;
}

export function resetTrackedElectronPids() {
  electronPids = [];
}
