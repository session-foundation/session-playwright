/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import { Page, test, TestInfo } from '@playwright/test';
import {
  buildStateForTest,
  PrebuiltStateKey,
  StateUser,
} from '@session-foundation/qa-seeder';
import chalk from 'chalk';

import { Group, User } from '../types/testing';
import { linkedDevice } from '../utilities/linked_device';
import { checkPathLight } from '../utilities/utils';
import { forceCloseAllWindows } from './closeWindows';
import { openApp, resetTrackedElectronPids, TestContext } from './open';
import { recoverFromSeed } from './recovery_using_seed';

// This is not ideal, most of our test needs to open a specific number of windows and close them once the test is done or failed.
// This file contains a bunch of utility function to use to open those windows and clean them afterwards.
// Note: those function only keep track (and close) the windows they open. If you open a new window or need to close and reopen an existing one, this won't take of it.

type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

type CountWindows = 1 | 2 | 3 | 4 | 5;

type WithAlice = { alice: User };
type WithBob = { bob: User };
type WithCharlie = { charlie: User };
type WithDracula = { dracula: User };

type WithAliceWindow1 = { aliceWindow1: Page };
type WithAliceWindow2 = { aliceWindow2: Page };
type WithBobWindow1 = { bobWindow1: Page };
type WithCharlieWindow1 = { charlieWindow1: Page };
type WithDraculaWindow1 = { draculaWindow1: Page };

type WithGroupCreated = { groupCreated: Group };

function sessionTest<T extends CountWindows, N extends Tuple<Page, T>>(
  testName: string,
  testCallback: (windows: N, testInfo: TestInfo) => Promise<void>,
  count: T,
  context?: TestContext,
) {
  return test(testName, async ({}, testinfo) => {
    resetTrackedElectronPids();
    const windows = await openApp(count, context);
    try {
      if (windows.length !== count) {
        throw new Error(
          `openApp should have opened ${count} windows but did not.`,
        );
      }
      await testCallback(windows as N, testinfo);
    } catch (e) {
      throw e;
    } finally {
      try {
        await forceCloseAllWindows(windows);
      } catch (e) {
        console.error(`forceCloseAllWindows of ${testName} failed with: `, e);
      }
    }
  });
}

export function sessionTestOneWindow(
  testName: string,
  testCallback: (windows: Tuple<Page, 1>, testInfo: TestInfo) => Promise<void>,
  context?: TestContext,
) {
  return sessionTest(testName, testCallback, 1, context);
}

export function sessionTestTwoWindows(
  testName: string,
  testCallback: ([windowA, windowB]: [Page, Page]) => Promise<void>,
  context?: TestContext,
) {
  return sessionTest(testName, testCallback, 2, context);
}

export function sessionTestThreeWindows(
  testName: string,
  testCallback: ([windowA, windowB, windowC]: [
    Page,
    Page,
    Page,
  ]) => Promise<void>,
  context?: TestContext,
) {
  return sessionTest(testName, testCallback, 3, context);
}

/**
 * This type can cause type checking performance issues, so only use it with small values
 */
type LessThan<
  TNumber extends number,
  TArray extends any[] = [],
> = TNumber extends TArray['length']
  ? TArray[number]
  : LessThan<TNumber, [...TArray, TArray['length']]>;

/**
 * This type can cause type checking performance issues, so only use it with small values.
 */
type NumericRange<TStart extends number, TEnd extends number> =
  | Exclude<LessThan<TEnd, []>, LessThan<TStart, []>>
  | Exclude<TEnd, LessThan<TStart, []>>;

/**
 * Get the network target for qa-seeder based on environment
 */
function getNetworkTarget(): 'mainnet' | 'testnet' | `http${string}` {
  const devnetUrl = process.env.LOCAL_DEVNET_SEED_URL;
  if (devnetUrl) {
    return devnetUrl as `http${string}`;
  }
  return 'testnet';
}

/**
 * Convert StateUser from qa-seeder to User type used in tests
 */
function stateUserToUser(stateUser: StateUser): User {
  return {
    userName: stateUser.userName,
    accountid: stateUser.sessionId,
    recoveryPassword: stateUser.seedPhrase,
  };
}

/**
 * Determine the appropriate prebuilt state key based on test parameters
 */
function getPrebuiltStateKey<
  UserCount extends 1 | 2 | 3 | 4,
  Grouped extends Array<NumericRange<1, UserCount>> | undefined,
>(userCount: UserCount, grouped: Grouped): PrebuiltStateKey {
  const hasGroup = grouped && grouped.length > 0;

  if (userCount === 1) {
    return '1user';
  }
  if (userCount === 2) {
    return hasGroup ? '2friendsInGroup' : '2friends';
  }
  if (userCount === 3) {
    return hasGroup ? '3friendsInGroup' : '3friends';
  }
  // userCount === 4, we don't have a 4-user prebuilt state yet, so use 3friends
  return hasGroup ? '3friendsInGroup' : '3friends';
}

function sessionTestGeneric<
  UserCount extends 1 | 2 | 3 | 4,
  Links extends Array<NumericRange<1, UserCount>>,
  Grouped extends Array<NumericRange<1, UserCount>>,
>(
  testName: string,
  userCount: UserCount,
  {
    links,
    grouped,
    waitForNetwork = true,
    context,
  }: {
    links?: Links;
    grouped?: Grouped;
    waitForNetwork?: boolean;
    context?: TestContext;
  },
  testCallback: (
    details: {
      users: Tuple<User, UserCount>;
      groupCreated: Grouped extends Array<any> ? Group : undefined;
      mainWindows: Tuple<Page, UserCount>;
      linkedWindows: Tuple<Page, Links['length']>;
    },
    testInfo: TestInfo,
  ) => Promise<void>,
) {
  const userNames: Tuple<string, 4> = ['Alice', 'Bob', 'Charlie', 'Dracula'];

  return test(testName, async ({}, testinfo) => {
    const mainWindows: Array<Page> = [];
    const linkedWindows: Array<Page> = [];

    try {
      // Build state on the swarm using qa-seeder
      const stateKey = getPrebuiltStateKey(userCount, grouped);
      const groupName = grouped && grouped.length > 0 ? testName : undefined;

      console.info(
        chalk.yellow(`Building prebuilt state "${stateKey}" on the swarm...`),
      );

      const [windows, prebuiltState] = await Promise.all([
        openApp(userCount, context),
        buildStateForTest(stateKey, groupName, getNetworkTarget()),
      ]);

      console.log('app opened        ');
      console.log('getNetworkTarget()   ', getNetworkTarget());
      console.log('stateKey   ', stateKey);
      console.log('groupName   ', groupName);

      mainWindows.push(...windows);

      if (mainWindows.length !== userCount) {
        throw new Error(
          `openApp should have opened ${userCount} windows but did not.`,
        );
      }

      console.info(
        chalk.green(
          `Prebuilt state ready. Restoring accounts from seed phrases...`,
        ),
      );

      // Restore accounts from the prebuilt seed phrases
      const users: Array<User> = [];
      for (let i = 0; i < userCount; i++) {
        const stateUser = prebuiltState.users[i];
        const window = mainWindows[i];

        console.info(
          `Restoring ${chalk.blue(
            stateUser.userName,
          )} with seed phrase "${chalk.green(stateUser.seedPhrase)}"`,
        );

        await recoverFromSeed(window, stateUser.seedPhrase);

        if (waitForNetwork) {
          await checkPathLight(window);
        }

        users.push(stateUserToUser(stateUser));
      }

      // Handle linked devices if needed
      if (links?.length) {
        for (let index = 0; index < links.length; index++) {
          const link = links[index];
          console.info(
            `linking a window with "${chalk.green(
              users[link - 1].recoveryPassword,
            )}"`,
          );
          const linked = await linkedDevice(users[link - 1].recoveryPassword);
          linkedWindows.push(linked);
        }
      }

      // Build Group object if group was created in prebuilt state
      let groupCreated: Group | undefined;
      if (grouped && grouped.length > 0 && 'group' in prebuiltState) {
        // Group already exists on the swarm, just create the Group object for the test
        groupCreated = {
          userName: prebuiltState.group.groupName,
          userOne: users[grouped[0] - 1],
          userTwo: users[grouped[1] - 1],
          userThree: users[grouped[2] - 1],
        };
        console.info(
          chalk.green(
            `Group "${groupCreated.userName}" already exists on the swarm`,
          ),
        );
      }

      // Sadly, we need to cast the parameters here, so our less generic function have correct types for the callback
      await testCallback(
        {
          mainWindows: mainWindows as Tuple<Page, UserCount>,
          linkedWindows: linkedWindows as Tuple<Page, Links['length']>,
          users: users as Tuple<User, UserCount>,
          groupCreated: groupCreated as Grouped extends Array<any>
            ? Group
            : undefined,
        },
        testinfo,
      );
    } catch (e) {
      throw e;
    } finally {
      try {
        await forceCloseAllWindows([...mainWindows, ...linkedWindows]);
      } catch (e) {
        console.error(`forceCloseAllWindows of ${testName} failed with: `, e);
      }
    }
  });
}

/**
 * Setup the test with 1 user and a single window, but don't wait for the network to be ready.
 * Used for tests which don't need network (i.e. setting/checking passwords etc)
 */
export function test_Alice1_no_network(
  testname: string,
  testCallback: (
    details: WithAlice & WithAliceWindow1,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    1,
    { waitForNetwork: false, context },
    ({ mainWindows, users }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          aliceWindow1: mainWindows[0],
        },
        testInfo,
      );
    },
  );
}

export function test_Alice1(
  testname: string,
  testCallback: (
    details: WithAlice & WithAliceWindow1,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    1,
    { waitForNetwork: true, context },
    ({ mainWindows, users }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          aliceWindow1: mainWindows[0],
        },
        testInfo,
      );
    },
  );
}

/**
 * Setup the test with 1 user and 2 windows total:
 * - Alice with 2 windows.
 */
export function test_Alice2(
  testname: string,
  testCallback: (
    details: WithAlice & WithAliceWindow1 & WithAliceWindow2,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    1,
    { links: [1], context },
    ({ mainWindows, users, linkedWindows }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          aliceWindow1: mainWindows[0],
          aliceWindow2: linkedWindows[0],
        },
        testInfo,
      );
    },
  );
}

/**
 * Setup the test with 2 users and 2 windows total:
 * - Alice with 1 window,
 * - Bob with 1 window.
 */
export function test_Alice1_Bob1(
  testname: string,
  testCallback: (
    details: WithAlice & WithAliceWindow1 & WithBob & WithBobWindow1,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    2,
    { context },
    ({ mainWindows, users }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          bob: users[1],
          aliceWindow1: mainWindows[0],
          bobWindow1: mainWindows[1],
        },
        testInfo,
      );
    },
  );
}

/**
 * Setup the test with 2 users and 3 windows total:
 * - Alice with 2 windows,
 * - Bob with 1 window.
 */
export function test_Alice2_Bob1(
  testname: string,
  testCallback: (
    details: WithAlice &
      WithAliceWindow1 &
      WithAliceWindow2 &
      WithBob &
      WithBobWindow1,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    2,
    { links: [1], context },
    ({ mainWindows, users, linkedWindows }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          bob: users[1],
          aliceWindow1: mainWindows[0],
          bobWindow1: mainWindows[1],
          aliceWindow2: linkedWindows[0],
        },
        testInfo,
      );
    },
  );
}

/**
 * Setup the test with a group having 3 users and 3 windows total:
 * - Alice with 1 window,
 * - Bob with 1 window,
 * - Charlie with 1 window.
 */
export function test_group_Alice1_Bob1_Charlie1(
  testname: string,
  testCallback: (
    details: WithAlice &
      WithAliceWindow1 &
      WithBob &
      WithBobWindow1 &
      WithCharlie &
      WithCharlieWindow1 &
      WithGroupCreated,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    3,
    { grouped: [1, 2, 3], context },
    ({ mainWindows, users, groupCreated }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          bob: users[1],
          charlie: users[2],
          aliceWindow1: mainWindows[0],
          bobWindow1: mainWindows[1],
          charlieWindow1: mainWindows[2],
          groupCreated,
        },
        testInfo,
      );
    },
  );
}

/**
 * Setup the test with a group having 3 users and 4 windows total:
 * - Alice with 2 windows,
 * - Bob with 1 window,
 * - Charlie with 1 window.
 */
export function test_group_Alice2_Bob1_Charlie1(
  testname: string,
  testCallback: (
    details: WithAlice &
      WithAliceWindow1 &
      WithAliceWindow2 &
      WithBob &
      WithBobWindow1 &
      WithCharlie &
      WithCharlieWindow1 &
      WithGroupCreated,
    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    3,
    { grouped: [1, 2, 3], links: [1], context },
    ({ mainWindows, users, groupCreated, linkedWindows }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          bob: users[1],
          charlie: users[2],
          aliceWindow1: mainWindows[0],
          bobWindow1: mainWindows[1],
          charlieWindow1: mainWindows[2],
          aliceWindow2: linkedWindows[0],
          groupCreated,
        },
        testInfo,
      );
    },
  );
}

/**
 * Setup the test with a group having 4 users and 4 windows total:
 * - Alice with 1 window,
 * - Bob with 1 window,
 * - Charlie with 1 window,
 * - Dracula with 1 window,
 */
export function test_group_Alice1_Bob1_Charlie1_Dracula1(
  testname: string,
  testCallback: (
    details: WithAlice &
      WithAliceWindow1 &
      WithBob &
      WithBobWindow1 &
      WithCharlie &
      WithCharlieWindow1 &
      WithDracula &
      WithDraculaWindow1 &
      WithGroupCreated,

    testInfo: TestInfo,
  ) => Promise<void>,
  context?: TestContext,
) {
  return sessionTestGeneric(
    testname,
    4,
    { grouped: [1, 2, 3], context },
    ({ mainWindows, users, groupCreated }, testInfo) => {
      return testCallback(
        {
          alice: users[0],
          bob: users[1],
          charlie: users[2],
          dracula: users[3],
          aliceWindow1: mainWindows[0],
          bobWindow1: mainWindows[1],
          charlieWindow1: mainWindows[2],
          draculaWindow1: mainWindows[3],
          groupCreated,
        },
        testInfo,
      );
    },
  );
}
