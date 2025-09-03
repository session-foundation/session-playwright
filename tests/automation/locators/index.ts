/* eslint-disable @typescript-eslint/lines-between-class-members */
import { DataTestId, StrategyExtractionObj } from '../types/testing';

export abstract class Locator {
  protected static testId(selector: DataTestId) {
    return {
      strategy: 'data-testid',
      selector,
    };
  }

  protected static hasText(selector: string): StrategyExtractionObj {
    return {
      strategy: ':has-text',
      selector,
    };
  }

  protected static className(selector: string): StrategyExtractionObj {
    return {
      strategy: 'class',
      selector,
    };
  }
}

export class Onboarding extends Locator {
    static readonly iHaveAnAccountButton = this.testId('existing-account-button');
    static readonly displayNameInput = this.testId('display-name-input');
    static readonly recoveryPhraseInput = this.testId('recovery-phrase-input');
}

export class LeftPane extends Locator {
  static readonly profileButton = this.testId('leftpane-primary-avatar');
  static readonly settingsButton = this.testId('settings-section');
}

export class HomeScreen extends Locator {
  static readonly newConversationButton = this.testId('new-conversation-button');
  static readonly conversationItemName = this.testId(
    'module-conversation__user__profile-name',
  );
  static readonly contactItemName = this.testId('module-contact-name__profile-name')
}

export class Conversation extends Locator {
  static readonly scrollToBottomButton = this.testId('scroll-to-bottom-button');
}

export class Settings extends Locator {
    // Profile
    static readonly displayName = this.testId('your-profile-name');
    static readonly accountId = this.testId('your-account-id');
    // Menu items
    static readonly privacyMenuItem = this.testId('privacy-settings-menu-item');
    static readonly recoveryPasswordMenuItem = this.testId('recovery-password-settings-menu-item');
    static readonly clearDataMenuItem = this.testId('clear-data-settings-menu-item');
    // Privacy
    static readonly setPasswordButton = this.testId('set-password-settings-button');
    static readonly changePasswordButton = this.testId('change-password-settings-button')
    static readonly passwordInput = this.testId('password-input');
    static readonly confirmPasswordInput = this.testId('password-input-confirm');
    static readonly reConfirmPasswordInput = this.testId('password-input-reconfirm');
    // Recovery Password
    static readonly recoveryPasswordContainer = this.testId('recovery-password-seed-modal');
    // Clear Data
    static readonly clearDeviceAndNetworkRadial = this.testId('label-device_and_network');
}

export class Global extends Locator {
    static readonly modalCloseButton = this.testId('modal-close-button');
    static readonly continueButton = this.testId('continue-button');
    static readonly toast = this.testId('session-toast');
    static readonly confirmButton = this.testId('session-confirm-ok-button');
    static readonly errorMessage = this.testId('error-message');
}