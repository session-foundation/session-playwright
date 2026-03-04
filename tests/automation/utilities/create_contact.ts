import { Page } from '@playwright/test';

import { User } from '../types/testing';
import { sendNewMessage } from './send_message';

export const createContact = async (
  windowA: Page,
  windowB: Page,
  userA: User,
  userB: User,
) => {
  const start = Date.now();
  const testMessage = `${userA.userName} to ${userB.userName}`;
  const testReply = `${userB.userName} to ${userA.userName}`;
  // User A sends message to User B
  await Promise.all([
    sendNewMessage(windowA, userB.accountid, testMessage),
    sendNewMessage(windowB, userA.accountid, testReply),
  ]);
  console.warn(`createContact took ${Date.now() - start}ms`);
};
