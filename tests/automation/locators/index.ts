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

export class LeftPane extends Locator {
  static readonly profileButton = this.testId('leftpane-primary-avatar');
  static readonly settingsButton = this.testId('invalid-data-testid'); // SES--4499
}

export class HomeScreen extends Locator {
  static readonly conversationItem = this.testId(
    'module-conversation__user__profile-name',
  );
}

export class Conversation extends Locator {
  static readonly scrollToBottomButton = this.testId('scroll-to-bottom-button');
}

export class Settings extends Locator {
    // Profile
    static readonly displayName = this.testId('your-profile-name');
    static readonly accountId = this.testId('your-account-id');
    // Menu items
    static readonly recoveryPasswordMenuItem = this.testId('recovery-password-settings-menu-item');
    // Recovery Password
    static readonly recoveryPasswordContainer = this.testId('recovery-password-seed-modal');
}

export class Global extends Locator {
    static readonly modalCloseButton = this.testId('modal-close-button');
}