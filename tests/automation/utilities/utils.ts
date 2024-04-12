/* eslint-disable no-useless-escape */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
import { ElementHandle, Page } from '@playwright/test';
import { sleepFor } from '../../promise_utils';
import {
  DataTestId,
  Strategy,
  StrategyExtractionObj,
  WithMaxWait,
  WithPage,
  WithRightButton,
  loaderType,
} from '../types/testing';
import { sendMessage } from './message';

// WAIT FOR FUNCTIONS

export async function waitForTestIdWithText(
  window: Page,
  dataTestId: DataTestId,
  text?: string,
  maxWait?: number,
) {
  let builtSelector = `css=[data-testid=${dataTestId}]`;
  if (text) {
    // " =>  \\\"
    /* prettier-ignore */

    const escapedText = text.replace(/"/g, '\\\"');

    builtSelector += `:has-text("${escapedText}")`;
    console.warn('builtSelector:', builtSelector);
    // console.warn('Text is tiny bubble: ', escapedText);
  }
  // console.info('looking for selector', builtSelector);
  const found = await window.waitForSelector(builtSelector, {
    timeout: maxWait,
  });
  // console.info('found selector', builtSelector);

  return found;
}

export async function waitForElement(
  window: Page,
  strategy: Strategy,
  selector: string,
  maxWaitMs?: number,
  text?: string,
) {
  const builtSelector = !text
    ? `css=[${strategy}=${selector}]`
    : `css=[${strategy}=${selector}]:has-text("${text.replace(/"/g, '\\"')}")`;

  return window.waitForSelector(builtSelector, { timeout: maxWaitMs });
}

export async function waitForTextMessage(
  window: Page,
  text: string,
  maxWait?: number,
) {
  let builtSelector = `css=[data-testid=message-content]:has-text("${text}")`;
  if (text) {
    // " =>  \\\"
    /* prettier-ignore */

    const escapedText = text.replace(/"/g, '\\\"');

    builtSelector += `:has-text("${escapedText}")`;
    console.warn('builtSelector:', builtSelector);
    // console.warn('Text is tiny bubble: ', escapedText);
  }
  const el = await window.waitForSelector(builtSelector, { timeout: maxWait });
  console.info(`Text message found. Text: , ${text}`);
  return el;
}

export async function waitForControlMessageWithText(
  window: Page,
  text: string,
) {
  return waitForTestIdWithText(window, 'message-content', text);
}

export async function waitForMatchingText(
  window: Page,
  text: string,
  maxWait?: number,
) {
  const builtSelector = `css=:has-text("${text}")`;
  const maxTimeout = maxWait ?? 55000;
  console.info(`waitForMatchingText: ${text}`);

  return window.waitForSelector(builtSelector, { timeout: maxTimeout });
}

export async function waitForMatchingPlaceholder(
  window: Page,
  dataTestId: string,
  placeholder: string,
  maxWait: number = 30000,
) {
  let found = false;
  const start = Date.now();
  console.info(
    `waitForMatchingPlaceholder: ${placeholder} with datatestId: ${dataTestId}`,
  );

  do {
    try {
      const elem = await waitForElement(window, 'data-testid', dataTestId);
      const elemPlaceholder = await elem.getAttribute('placeholder');
      if (elemPlaceholder === placeholder) {
        console.info(
          `waitForMatchingPlaceholder found matching element with placeholder: "${placeholder}"`,
        );

        found = true;
      }
    } catch (e) {
      await sleepFor(1000, true);
      console.info(
        `waitForMatchingPlaceholder failed with ${e.message}, retrying in 1s`,
      );
    }
  } while (!found && Date.now() - start <= maxWait);

  if (!found) {
    throw new Error(
      `Failed to find datatestid:"${dataTestId}" with placeholder: "${placeholder}"`,
    );
  }
}
export async function waitForLoadingAnimationToFinish(
  window: Page,
  loader: loaderType,
  maxWait?: number,
) {
  let loadingAnimation: ElementHandle<SVGElement | HTMLElement> | undefined;

  await waitForElement(window, 'data-testid', `${loader}`, maxWait);

  do {
    try {
      loadingAnimation = await waitForElement(
        window,
        'data-testid',
        `${loader}`,
        100,
      );
      await sleepFor(500);
      console.info(`${loader} was found, waiting for it to be gone`);
    } catch (e) {
      loadingAnimation = undefined;
    }
  } while (loadingAnimation);
  console.info('Loading animation has finished');
}

export async function checkPathLight(window: Page, maxWait?: number) {
  const maxWaitTime = maxWait || 500000;
  const waitPerLoop = 100;
  const start = Date.now();
  let pathColor: string | null = null;

  await doWhileWithMax(maxWaitTime, waitPerLoop, 'checkPathLight', async () => {
    const pathLight = await waitForElement(
      window,
      'data-testid',
      'path-light-container',
      maxWait,
    );
    pathColor = await pathLight.getAttribute('color');

    if (Date.now() - start >= maxWaitTime / 10) {
      console.log('Path building...');
    }

    return pathColor === 'var(--button-path-default-color)';
  });

  console.log('Path built correctly, Yay!', pathColor);
}

// ACTIONS

export async function clickOnElement({
  window,
  maxWait,
  rightButton,
  ...obj
}: WithPage & StrategyExtractionObj & WithMaxWait & WithRightButton) {
  const builtSelector = `css=[${obj.strategy}=${obj.selector}]`;
  await window.waitForSelector(builtSelector, { timeout: maxWait });
  await window.click(
    builtSelector,
    rightButton ? { button: 'right' } : undefined,
  );
}

export async function lookForPartialTestId(
  window: Page,
  selector: string,
  click?: boolean,
  rightButton?: boolean,
  maxWait?: number,
) {
  const builtSelector = `css=[data-testid^="${selector}"]`;
  await window.waitForSelector(builtSelector, { timeout: maxWait });
  if (click) {
    await window.click(
      builtSelector,
      rightButton ? { button: 'right' } : undefined,
    );
  }
  return builtSelector;
}

//

export async function clickOnMatchingText(
  window: Page,
  text: string,
  rightButton = false,
) {
  console.info(`clickOnMatchingText: "${text}"`);
  return window.click(
    `"${text}"`,
    rightButton ? { button: 'right' } : undefined,
  );
}

export async function clickOnTestIdWithText(
  window: Page,
  dataTestId: DataTestId,
  text?: string,
  rightButton?: boolean,
  maxWait?: number,
) {
  console.info(
    `clickOnTestIdWithText with testId:${dataTestId} and text:${
      text || 'none'
    }`,
  );

  const builtSelector = !text
    ? `css=[data-testid=${dataTestId}]`
    : `css=[data-testid=${dataTestId}]:has-text("${text}")`;

  await window.waitForSelector(builtSelector, { timeout: maxWait });
  return window.click(
    builtSelector,
    rightButton ? { button: 'right' } : undefined,
  );
}

export async function clickOnTextMessage(
  window: Page,
  text: string,
  rightButton?: boolean,
  maxWait?: number,
) {
  const builtSelector = `css=[data-testid=message-content]:has-text("${text}")`;
  await window.waitForSelector(builtSelector, { timeout: maxWait });
  await window.click(
    builtSelector,
    rightButton ? { button: 'right' } : undefined,
  );
}

export function getMessageTextContentNow() {
  return `Test message timestamp: ${Date.now()}`;
}

export async function typeIntoInput(
  window: Page,
  dataTestId: DataTestId,
  text: string,
) {
  console.info(`typeIntoInput testId: ${dataTestId} : "${text}"`);
  const builtSelector = `css=[data-testid=${dataTestId}]`;
  return window.fill(builtSelector, text);
}

export async function typeIntoInputSlow(
  window: Page,
  dataTestId: DataTestId,
  text: string,
) {
  console.info(`typeIntoInput testId: ${dataTestId} : "${text}"`);
  const builtSelector = `css=[data-testid=${dataTestId}]`;
  await window.waitForSelector(builtSelector);
  return window.type(builtSelector, text, { delay: 100 });
}

export async function doesTextIncludeString(
  window: Page,
  dataTestId: DataTestId,
  text: string,
) {
  const element = await waitForTestIdWithText(window, dataTestId);
  const el = await element.innerText();

  const builtSelector = el.includes(text);
  if (builtSelector) {
    console.info('Text found:', text);
  } else {
    throw new Error(`Text not found: "${text}"`);
  }
}

export async function hasElementBeenDeleted(
  window: Page,
  strategy: Strategy,
  selector: string,
  maxWait: number = 30000,
  text?: string,
) {
  const start = Date.now();

  let el: ElementHandle<SVGElement | HTMLElement> | undefined;
  do {
    try {
      el = await waitForElement(window, strategy, selector, maxWait, text);
      await sleepFor(100);
      console.info(`Element has been found, waiting for deletion`);
    } catch (e) {
      el = undefined;
      console.info(`Element has been deleted, woohoo!`);
    }
  } while (Date.now() - start <= maxWait && el);
  try {
    el = await waitForElement(window, strategy, selector, 1000, text);
  } catch (e) {
    // if we did throw here it's actually because the element is gone, so it's ok
  }

  if (el) {
    throw new Error(
      `hasElementBeenDeleted: element with selector ${selector} was expected to be gone but is still there`,
    );
  }
  console.info(`Element has been deleted yay`);
}

export async function hasTextMessageBeenDeleted(
  window: Page,
  text: string,
  maxWait: number = 5000,
) {
  await doWhileWithMax(
    15000,
    500,
    'waiting for text message to be deleted',
    async () => {
      try {
        await waitForElement(
          window,
          'data-testid',
          'message-content',
          maxWait,
          text,
        );
        return false;
      } catch (e) {
        console.info(`Text message not found, yay!`);
        return true;
      }
    },
  );
}

export async function hasElementPoppedUpThatShouldnt(
  window: Page,
  strategy: Strategy,
  selector: string,
  text?: string,
) {
  const builtSelector = !text
    ? `css=[${strategy}=${selector}]`
    : `css=[${strategy}=${selector}]:has-text("${text.replace(/"/g, '\\"')}")`;

  const fakeError = `Found ${selector}, oops..`;
  const elVisible = await window.isVisible(builtSelector);
  if (elVisible === true) {
    throw new Error(fakeError);
  }
}

export async function measureSendingTime(window: Page, messageNumber: number) {
  const message = `Test-message`;
  const timeStart = Date.now();

  await sendMessage(window, message);

  const timeEnd = Date.now();
  const timeMs = timeEnd - timeStart;

  console.log(`Message ${messageNumber}: ${timeMs}`);
  return timeMs;
}

export async function doWhileWithMax(
  maxWaitMs: number,
  waitBetweenMs: number,
  label: string,
  actionTodo: () => Promise<boolean>,
) {
  const start = Date.now();
  let iteration = 0;
  let wasSuccess = false;
  do {
    try {
      wasSuccess = await actionTodo();
    } catch (e) {
      console.error(
        `doWhileWithMax with label:"${label}" iteration:${iteration} failed with: ${e.message}`,
        e,
      );
    }
    iteration++;
    await sleepFor(waitBetweenMs);
  } while (!wasSuccess && Date.now() - start < maxWaitMs);

  if (!wasSuccess) {
    throw new Error(
      `doWhileWithMax with label:"${label}" still failing after ${maxWaitMs}ms`,
    );
  }
}
