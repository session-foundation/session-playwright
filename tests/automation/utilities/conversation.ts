import type { Page } from '@playwright/test';

import { HomeScreen } from '../locators';
import { clickOnWithText } from './utils';

/**
 * Open a conversation from the left pane with the provided name
 */
export async function openConversationWith(window: Page, convoName: string) {
  await clickOnWithText(window, HomeScreen.conversationItemName, convoName);
}
