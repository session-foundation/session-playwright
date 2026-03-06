import { Page } from '@playwright/test';

import { tStripped } from '../localization/lib';
import { Global, HomeScreen } from './locators';
import { test_Alice_1W } from './setup/sessionTest';
import { joinCommunity } from './utilities/join_community';
import { sendMessage } from './utilities/message';
import {
  assertPinOrder,
  clickOn,
  clickOnWithText,
  getConversationOrder,
  pasteIntoInput,
  rightClickOnWithText,
  waitForTestIdWithText,
} from './utilities/utils';

async function pinConversation(window: Page, conversationName: string) {
  await rightClickOnWithText(
    window,
    HomeScreen.conversationItemName,
    conversationName,
  );
  await clickOnWithText(window, Global.contextMenuItem, tStripped('pin'));
}

async function unpinConversation(window: Page, conversationName: string) {
  await rightClickOnWithText(
    window,
    HomeScreen.conversationItemName,
    conversationName,
  );
  await clickOnWithText(window, Global.contextMenuItem, tStripped('pinUnpin'));
}

test_Alice_1W(
  'Pin and unpin a conversation',
  async ({ aliceWindow1, alice }) => {
    await clickOn(aliceWindow1, HomeScreen.plusButton);
    await clickOn(aliceWindow1, HomeScreen.newMessageOption);
    await pasteIntoInput(
      aliceWindow1,
      HomeScreen.newMessageAccountIDInput.selector,
      alice.accountid,
    );
    await clickOn(aliceWindow1, HomeScreen.newMessageNextButton);
    await waitForTestIdWithText(
      aliceWindow1,
      'header-conversation-name',
      tStripped('noteToSelf'),
    );
    await sendMessage(aliceWindow1, 'Buy milk');
    await joinCommunity(aliceWindow1);

    const beforeOrder = await getConversationOrder(aliceWindow1);
    const lastConversation = beforeOrder[beforeOrder.length - 1];
    console.log('Order before pinning:', beforeOrder);
    console.log('Pinning:', lastConversation);

    const pinIcon = aliceWindow1
      .locator(`css=.${HomeScreen.conversationItemHeader.selector}`)
      .filter({ hasText: lastConversation })
      .locator(`[data-testid="${HomeScreen.pinnedConversationIcon.selector}"]`);

    await pinConversation(aliceWindow1, lastConversation);
    await pinIcon.waitFor({ state: 'visible' });
    const afterPinOrder = await getConversationOrder(aliceWindow1);
    console.log('Order after pinning:', afterPinOrder);
    assertPinOrder(beforeOrder, [lastConversation], afterPinOrder);

    await unpinConversation(aliceWindow1, lastConversation);
    await pinIcon.waitFor({ state: 'hidden' });
    const afterUnpinOrder = await getConversationOrder(aliceWindow1);
    console.log('Order after unpinning:', afterUnpinOrder);
    assertPinOrder(beforeOrder, [], afterUnpinOrder);
  },
);
