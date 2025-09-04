/* eslint-disable @typescript-eslint/lines-between-class-members */
import { DataTestId, StrategyExtractionObj } from '../types/testing';

export abstract class Locator {
  protected static className(selector: string): StrategyExtractionObj {
    return {
      strategy: 'class',
      selector,
    };
  }

  protected static hasText(selector: string): StrategyExtractionObj {
    return {
      strategy: ':has-text',
      selector,
    };
  }

  protected static testId(selector: DataTestId) {
    return {
      strategy: 'data-testid',
      selector,
    };
  }
}

export class Onboarding extends Locator {
  static readonly displayNameInput = this.testId('display-name-input');
  static readonly iHaveAnAccountButton = this.testId('existing-account-button');
  static readonly recoveryPhraseInput = this.testId('recovery-phrase-input');
}

export class LeftPane extends Locator {
  static readonly profileButton = this.testId('leftpane-primary-avatar');
  static readonly settingsButton = this.testId('settings-section');
}

export class HomeScreen extends Locator {
  // New Conversation
  static readonly createGroupOption = this.testId('chooser-new-group');
  static readonly inviteAFriendOption = this.testId('chooser-invite-friend');
  static readonly joinCommunityOption = this.testId('chooser-new-community');
  static readonly newMessageAccountIDInput = this.testId(
    'new-session-conversation',
  );
  static readonly newMessageNextButton = this.testId(
    'next-new-conversation-button',
  );
  static readonly newMessageOption = this.testId(
    'chooser-new-conversation-button',
  );
  // Home Screen items
  static readonly conversationItemName = this.testId(
    'module-conversation__user__profile-name',
  );
  static readonly messageRequestBanner = this.testId('message-request-banner');
  static readonly newConversationButton = this.testId(
    'new-conversation-button',
  );
}

export class Conversation extends Locator {
  static readonly acceptMessageRequestButton = this.testId(
    'accept-message-request',
  );
  static readonly blockMessageRequestButton = this.testId(
    'decline-and-block-message-request',
  );
  static readonly callButton = this.testId('call-button');
  static readonly conversationHeader = this.testId('header-conversation-name');
  static readonly conversationSettingsIcon = this.testId(
    'conversation-options-avatar',
  );
  static readonly deleteMessageRequestButton = this.testId(
    'delete-message-request',
  );
  static readonly endVoiceMessageButton = this.testId('end-voice-message');
  static readonly manageMembersOption = this.testId(
    'manage-members-menu-option',
  );
  static readonly messageInput = this.testId('message-input-text-area');
  static readonly messageRequestAcceptControlMessage = this.testId(
    'message-request-response-message',
  );
  static readonly microphoneButton = this.testId('microphone-button');
  static readonly scrollToBottomButton = this.testId('scroll-to-bottom-button');
}

export class Settings extends Locator {
  // Profile
  static readonly accountId = this.testId('your-account-id');
  static readonly displayName = this.testId('your-profile-name');
  // Update Profile Information
  static readonly displayNameInput = this.testId(
    'update-profile-info-name-input',
  );
  // Menu items
  static readonly clearDataMenuItem = this.testId(
    'clear-data-settings-menu-item',
  );
  static readonly conversationsMenuItem = this.testId(
    'conversations-settings-menu-item',
  );
  static readonly privacyMenuItem = this.testId('privacy-settings-menu-item');
  static readonly recoveryPasswordMenuItem = this.testId(
    'recovery-password-settings-menu-item',
  );
  // Privacy
  static readonly changePasswordSettingsButton = this.testId(
    'change-password-settings-button',
  );
  static readonly confirmPasswordInput = this.testId('password-input-confirm');
  static readonly enableCalls = this.testId('enable-calls-settings-row');
  static readonly enableMicrophone = this.testId(
    'enable-microphone-settings-row',
  );
  static readonly enableReadReceipts = this.testId(
    'enable-read-receipts-settings-row',
  );
  static readonly passwordInput = this.testId('password-input');
  static readonly reConfirmPasswordInput = this.testId(
    'password-input-reconfirm',
  );
  static readonly setPasswordButton = this.testId('set-password-button');
  static readonly setPasswordSettingsButton = this.testId(
    'set-password-settings-button',
  );
  // Conversations
  static readonly blockedContactsButton = this.testId(
    'blocked-contacts-settings-row',
  );
  static readonly unblockButton = this.testId('unblock-button-settings-screen');
  // Recovery Password
  static readonly recoveryPasswordContainer = this.testId(
    'recovery-password-seed-modal',
  );
  // Clear Data
  static readonly clearDeviceAndNetworkRadial = this.testId(
    'label-device_and_network',
  );
}

export class Global extends Locator {
  static readonly backButton = this.testId('back-button');
  static readonly cancelButton = this.testId('session-confirm-cancel-button');
  static readonly confirmButton = this.testId('session-confirm-ok-button');
  static readonly contactItem = this.testId(
    'module-contact-name__profile-name',
  );
  static readonly contextMenuItem = this.testId('context-menu-item');
  static readonly continueButton = this.testId('continue-button');
  static readonly errorMessage = this.testId('error-message');
  static readonly modalBackButton = this.testId('modal-back-button');
  static readonly modalCloseButton = this.testId('modal-close-button');
  static readonly toast = this.testId('session-toast');
}
