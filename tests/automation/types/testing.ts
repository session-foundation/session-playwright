import { Page } from '@playwright/test';

export type User = {
  userName: string;
  accountid: string;
  recoveryPassword: string;
};

export type Group = {
  userName: string;
  userOne: User;
  userTwo: User;
  userThree: User;
};

export type ConversationType = '1:1' | 'group' | 'community' | 'note-to-self';

export type DMTimeOption =
  | 'time-option-0-seconds'
  | 'time-option-5-seconds'
  | 'time-option-10-seconds'
  | 'time-option-30-seconds'
  | 'time-option-60-seconds'
  | 'time-option-5-minutes'
  | 'time-option-30-minutes'
  | 'time-option-1-hours'
  | 'time-option-6-hours'
  | 'time-option-12-hours'
  | 'time-option-1-days'
  | 'time-option-7-days'
  | 'time-option-14-days'
  | 'input-10-seconds'
  | 'disappear-off-option';

type DisappearOpts1o1 = [
  '1:1',
  'disappear-after-read-option' | 'disappear-after-send-option',
  DMTimeOption,
  DisappearActions,
];

type DisappearOptsGroup = [
  'group' | 'note-to-self',
  DisappearGroupType,
  DMTimeOption,
  DisappearActions,
];

export type DisappearOptions = DisappearOpts1o1 | DisappearOptsGroup;
export type DisappearType =
  | 'disappear-after-read-option'
  | 'disappear-after-send-option';

export type DisappearGroupType = Exclude<
  DisappearType,
  'disappear-after-read-option'
>;

export type DisappearActions = 'read' | 'sent';

export type StrategyExtractionObj =
  | {
      strategy: Extract<Strategy, ':has-text' | 'class'>;
      selector: string;
    }
  | {
      strategy: Extract<Strategy, 'data-testid'>;
      selector: DataTestId;
    };

export type WithPage = { window: Page };
export type WithMaxWait = { maxWait?: number };
export type WithRightButton = { rightButton?: boolean };

export type LoaderType = 'loading-animation' | 'loading-spinner';
export type MediaType = 'image' | 'video' | 'audio' | 'file';
export type Strategy = 'data-testid' | 'class' | ':has-text';

// Would be good to find a way to sort those with prettier
export type DataTestId =
  | 'session-id-signup'
  | 'display-name-input'
  | 'recovery-password-seed-modal'
  | 'path-light-container'
  | 'new-conversation-button'
  | 'chooser-new-conversation-button'
  | 'new-session-conversation'
  | 'next-new-conversation-button'
  | 'control-message'
  | 'disappear-control-message'
  | 'disappearing-messages-indicator'
  | 'back-button-conversation-options'
  | 'conversation-options-avatar'
  | 'settings-section'
  | 'clear-data-settings-menu-item'
  | 'message-requests-settings-menu-item'
  | 'restore-using-recovery'
  | 'reveal-recovery-phrase'
  | 'recovery-phrase-input'
  | 'continue-session-button'
  | 'label-device_and_network'
  | 'message-request-banner'
  | 'module-conversation__user__profile-name'
  | 'delete-message-request'
  | 'session-confirm-ok-button'
  | 'dropdownitem-5-seconds'
  | 'disappearing-messages-dropdown'
  | 'session-toast'
  | 'accept-message-request'
  | 'confirm-nickname'
  | 'nickname-input'
  | 'three-dots-conversation-options'
  | 'message-section'
  | 'conversations-settings-menu-item'
  | 'reveal-blocked-user-settings'
  | 'unblock-button-settings-screen'
  | 'leftpane-primary-avatar'
  | 'edit-profile-icon'
  | 'edit-group-name'
  | 'profile-name-input'
  | 'image-upload-section'
  | 'save-button-profile-update'
  | 'modal-close-button'
  | 'send-message-button'
  | 'message-input-text-area'
  | 'end-voice-message'
  | 'microphone-button'
  | 'enable-microphone'
  | 'theme-section'
  | 'call-button'
  | 'enable-calls'
  | 'end-call'
  | 'privacy-settings-menu-item'
  | 'set-password-button'
  | 'password-input'
  | 'password-input-confirm'
  | 'change-password-settings-button'
  | 'password-input-reconfirm'
  | 'recovery-password-settings-menu-item'
  | 'messages-container'
  | 'chooser-new-group'
  | 'new-closed-group-name'
  | 'create-group-button'
  | 'link-device'
  | 'group-name-input'
  | 'right-panel-group-name'
  | 'header-conversation-name'
  | 'copy-button-profile-update'
  | 'loading-spinner'
  | 'empty-conversation-notification'
  | 'your-profile-name'
  | 'your-session-id'
  | 'mentions-popup-row'
  | 'enable-read-receipts'
  | 'disappear-set-button'
  | 'disappear-after-read-option'
  | 'disappearing-messages'
  | 'disappear-after-send-option'
  | 'disappear-set-button'
  | 'add-user-button'
  | 'message-content'
  | 'group-update-message'
  | 'message-request-response-message'
  | 'image-upload-click'
  | 'leave-group-button'
  | 'create-account-button'
  | 'continue-button'
  | 'existing-account-button'
  | 'context-menu-item'
  | 'modal-description'
  | 'session-error-message'
  | DMTimeOption
  | `input-${DMTimeOption}`
  | 'disappear-messages-type-and-time'
  | 'hide-recovery-password-button'
  | 'chooser-new-community'
  | 'join-community-conversation'
  | 'join-community-button'
  | 'scroll-to-bottom-button'
  | 'decline-and-block-message-request'
  | 'contact'
  | 'modal-heading'
  | 'call-notification-answered-a-call'
  | 'call-notification-started-call'
  | 'audio-player'
  | 'chooser-invite-friend'
  | 'your-account-id'
  | 'copy-button-account-id'
  | 'link-preview-image'
  | 'link-preview-title'
  | 'error-message'
  | 'group-members'
  | 'session-confirm-cancel-button'
  | 'session-recovery-password'
  | 'session-network-settings-menu-item'
  | 'learn-more-network-link'
  | 'refresh-button'
  | 'last-updated-timestamp';
