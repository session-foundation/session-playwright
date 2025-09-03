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

export type ConversationType = '1:1' | 'community' | 'group' | 'note-to-self';

export type DMTimeOption =
  | 'disappear-off-option'
  | 'input-10-seconds'
  | 'time-option-0-seconds'
  | 'time-option-1-days'
  | 'time-option-1-hours'
  | 'time-option-10-seconds'
  | 'time-option-12-hours'
  | 'time-option-14-days'
  | 'time-option-30-minutes'
  | 'time-option-30-seconds'
  | 'time-option-5-minutes'
  | 'time-option-5-seconds'
  | 'time-option-6-hours'
  | 'time-option-60-seconds'
  | 'time-option-7-days';

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
export type MediaType = 'audio' | 'file' | 'image' | 'video';
export type Strategy = ':has-text' | 'class' | 'data-testid';

// Would be good to find a way to sort those with prettier
// TODO sort with eslint plugin perfectionist
export type DataTestId =
  | DMTimeOption
  | 'accept-message-request'
  | 'audio-player'
  | 'back-button'
  | 'blocked-contacts-settings-row'
  | 'call-button'
  | 'call-notification-answered-a-call'
  | 'call-notification-started-call'
  | 'change-password-settings-button'
  | 'chooser-invite-friend'
  | 'chooser-new-community'
  | 'chooser-new-conversation-button'
  | 'chooser-new-group'
  | 'clear-data-settings-menu-item'
  | 'clear-group-info-name-button'
  | 'contact'
  | 'context-menu-item'
  | 'continue-button'
  | 'continue-session-button'
  | 'control-message'
  | 'conversation-options-avatar'
  | 'conversations-settings-menu-item'
  | 'copy-button-account-id'
  | 'copy-button-profile-update'
  | 'create-account-button'
  | 'create-group-button'
  | 'decline-and-block-message-request'
  | 'delete-message-request'
  | 'disappear-after-read-option'
  | 'disappear-after-send-option'
  | 'disappear-control-message'
  | 'disappear-messages-type-and-time'
  | 'disappear-set-button'
  | 'disappear-set-button'
  | 'disappearing-messages-dropdown'
  | 'disappearing-messages-indicator'
  | 'disappearing-messages-menu-option'
  | 'display-name-input'
  | 'dropdownitem-5-seconds'
  | 'edit-group-name'
  | 'edit-profile-icon'
  | 'empty-conversation-notification'
  | 'enable-calls'
  | 'enable-microphone'
  | 'enable-read-receipts'
  | 'end-call'
  | 'end-voice-message'
  | 'error-message'
  | 'existing-account-button'
  | 'group-name'
  | 'group-update-message'
  | 'header-conversation-name'
  | 'hide-recovery-password-button'
  | 'image-upload-click'
  | 'image-upload-section'
  | 'invite-contacts-menu-option'
  | 'join-community-button'
  | 'join-community-conversation'
  | 'label-device_and_network'
  | 'leave-group-button'
  | 'leftpane-primary-avatar'
  | 'link-device'
  | 'link-preview-image'
  | 'link-preview-title'
  | 'loading-spinner'
  | 'manage-members-menu-option'
  | 'mentions-popup-row'
  | 'message-content'
  | 'message-input-text-area'
  | 'message-request-banner'
  | 'message-request-response-message'
  | 'message-requests-settings-menu-item'
  | 'messages-container'
  | 'microphone-button'
  | 'modal-back-button'
  | 'modal-close-button'
  | 'modal-description'
  | 'modal-heading'
  | 'module-contact-name__profile-name'
  | 'module-conversation__user__profile-name'
  | 'new-closed-group-name'
  | 'new-conversation-button'
  | 'new-session-conversation'
  | 'next-new-conversation-button'
  | 'nickname-input'
  | 'password-input-confirm'
  | 'password-input-reconfirm'
  | 'password-input'
  | 'path-light-container'
  | 'privacy-settings-menu-item'
  | 'profile-name-input'
  | 'recovery-password-seed-modal'
  | 'recovery-password-settings-menu-item'
  | 'recovery-phrase-input'
  | 'restore-using-recovery'
  | 'reveal-recovery-phrase'
  | 'save-button-profile-update'
  | 'scroll-to-bottom-button'
  | 'send-message-button'
  | 'session-confirm-cancel-button'
  | 'session-confirm-ok-button'
  | 'session-id-signup'
  | 'session-recovery-password'
  | 'session-toast'
  | 'set-nickname-confirm-button'
  | 'set-password-button'
  | 'set-password-settings-button'
  | 'settings-section'
  | 'theme-section'
  | 'unblock-button-settings-screen'
  | 'update-group-info-name-input'
  | 'update-profile-info-name-input'
  | 'your-account-id'
  | 'your-profile-name'
  | `input-${DMTimeOption}`;

export type ModalId = 'blockOrUnblockModal' | 'userSettingsModal';
