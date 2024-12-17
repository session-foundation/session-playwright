import { englishStrippedStr } from '../locale/localizedString';
import { sessionTestOneWindow } from './setup/sessionTest';
import {
  clickOnTestIdWithText,
  grabTextFromElement,
  typeIntoInput,
  waitForTestIdWithText,
} from './utilities/utils';

sessionTestOneWindow('Onboarding incorrect seed', async ([window]) => {
  const incorrectSeed =
    'ruby bakery illness push rift reef nabbing bawled hope zork silk lobster hope';
  const expectedError = englishStrippedStr(
    'recoveryPasswordErrorMessageIncorrect',
  ).toString();
  await clickOnTestIdWithText(window, 'existing-account-button');
  await typeIntoInput(window, 'recovery-phrase-input', incorrectSeed);
  await clickOnTestIdWithText(window, 'continue-button');
  await waitForTestIdWithText(window, 'session-error-message');
  const actualError = await grabTextFromElement(
    window,
    'data-testid',
    'session-error-message',
  );
  if (actualError !== expectedError) {
    throw new Error(
      `Expected error message: ${expectedError}, but got: ${actualError}`,
    );
  }
});

sessionTestOneWindow('Onboarding too short seed', async ([window]) => {
  const incorrectSeed = 'zork';
  const expectedError = englishStrippedStr(
    'recoveryPasswordErrorMessageShort',
  ).toString();
  await clickOnTestIdWithText(window, 'existing-account-button');
  await typeIntoInput(window, 'recovery-phrase-input', incorrectSeed);
  await clickOnTestIdWithText(window, 'continue-button');
  await waitForTestIdWithText(window, 'session-error-message');
  const actualError = await grabTextFromElement(
    window,
    'data-testid',
    'session-error-message',
  );
  if (actualError !== expectedError) {
    throw new Error(
      `Expected error message: ${expectedError}, but got: ${actualError}`,
    );
  }
});

sessionTestOneWindow('Onboarding wrong seed', async ([window]) => {
  const incorrectSeed =
    'ruby bakery illness push rift reef nabbing bawled hope ruby silk lobster hope ruby ruby ruby';
  const expectedError = englishStrippedStr(
    'recoveryPasswordErrorMessageGeneric',
  ).toString();
  await clickOnTestIdWithText(window, 'existing-account-button');
  await typeIntoInput(window, 'recovery-phrase-input', incorrectSeed);
  await clickOnTestIdWithText(window, 'continue-button');
  await waitForTestIdWithText(window, 'session-error-message');
  const actualError = await grabTextFromElement(
    window,
    'data-testid',
    'session-error-message',
  );
  if (actualError !== expectedError) {
    throw new Error(
      `Expected error message: ${expectedError}, but got: ${actualError}`,
    );
  }
});

sessionTestOneWindow('Onboarding no name', async ([window]) => {
  const emptyName = ' ';
  const expectedError = englishStrippedStr(
    'displayNameErrorDescription',
  ).toString();
  await clickOnTestIdWithText(window, 'create-account-button');
  await typeIntoInput(window, 'display-name-input', emptyName);
  await clickOnTestIdWithText(window, 'continue-button');
  await waitForTestIdWithText(window, 'session-error-message');
  const actualError = await grabTextFromElement(
    window,
    'data-testid',
    'session-error-message',
  );
  if (actualError !== expectedError) {
    throw new Error(
      `Expected error message: ${expectedError}, but got: ${actualError}`,
    );
  }
});

sessionTestOneWindow('Onboarding too long name', async ([window]) => {
  const tooLongName =
    'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed int';
  const expectedError = englishStrippedStr(
    'displayNameErrorDescriptionShorter',
  ).toString();
  await clickOnTestIdWithText(window, 'create-account-button');
  await typeIntoInput(window, 'display-name-input', tooLongName);
  await clickOnTestIdWithText(window, 'continue-button');
  await waitForTestIdWithText(window, 'session-error-message');
  const actualError = await grabTextFromElement(
    window,
    'data-testid',
    'session-error-message',
  );
  if (actualError !== expectedError) {
    throw new Error(
      `Expected error message: ${expectedError}, but got: ${actualError}`,
    );
  }
});
