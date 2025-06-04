import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { englishStrippedStr } from '../localization/englishStrippedStr';
import {
  isPluralToken,
  type MergedLocalizerTokens,
  type PluralLocalizerTokens,
  type SimpleLocalizerTokens,
} from '../localization/Localizer';

function readTsFiles(dir: string): Record<string, string> {
  const tsFilesContent: Record<string, string> = {};

  function walkDirectory(currentDir: string): void {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules') {
          // Recurse into subdirectories, excluding node_modules
          walkDirectory(filePath);
        }
      } else if (file.endsWith('.ts')) {
        // Read .ts files
        const content = fs.readFileSync(filePath, 'utf-8');
        tsFilesContent[filePath] = content;
      }
    });
  }

  walkDirectory(dir);
  return tsFilesContent;
}

function extractAllTokens(text: string) {
  const pattern = /englishStrippedStr\(\s*'([^']*)'\s*\)/g;

  const matches = [...text.matchAll(pattern)];

  return matches.map((match) => match?.[1]) as Array<MergedLocalizerTokens>;
}

function getExpectedStringFromKey(
  args:
    | { key: SimpleLocalizerTokens }
    | { key: PluralLocalizerTokens; count: number },
) {
  if (isPluralToken(args.key)) {
    if (!('count' in args)) {
      throw new Error(
        `getExpectedStringFromKey: ${args.key} is a plural form and expected count to be set`,
      );
    }
  }
  switch (args.key) {
    // plurals are centralized here
    case 'deleteMessageDeleted':
      return args.count === 1 ? 'Message deleted' : 'Messages deleted';
    case 'deleteMessage':
      return args.count === 1 ? 'Delete Message' : 'Delete Messages';
    case 'deleteMessageConfirm':
      return args.count === 1
        ? 'Are you sure you want to delete this message?'
        : 'Are you sure you want to delete these messages?';
    case 'accept':
      return 'Accept';
    case 'sessionClearData':
      return 'Clear Data';
    case 'clearDeviceAndNetwork':
      return 'Clear device and network';
    case 'clear':
      return 'Clear';
    case 'disappearingMessagesSetYou':
      return 'You set messages to disappear {time} after they have been {disappearing_messages_type}.';
    case 'noteToSelf':
      return 'Note to Self';
    case 'okay':
      return 'Okay';
    case 'legacyGroupMemberNew':
      return '{name} joined the group.';
    case 'groupNameNew':
      return 'Group name is now {group_name}.';
    case 'groupNameEnterPlease':
      return 'Please enter a group name.';
    case 'cancel':
      return 'Cancel';
    case 'groupMemberLeft':
      return '{name} left the group.';
    case 'messageRequestYouHaveAccepted':
      return 'You have accepted the message request from {name}.';
    case 'messageRequestsNonePending':
      return 'No pending message requests';
    case 'decline':
      return 'Decline';
    case 'delete':
      return 'Delete';
    case 'copy':
      return 'Copy';
    case 'clearMessagesForEveryone':
      return 'Clear for everyone';
    case 'block':
      return 'Block';
    case 'blockBlockedDescription':
      return 'Unblock this contact to send a message';
    case 'attachmentsClickToDownload':
      return 'Click to download {file_type}';
    case 'media':
      return 'Media';
    case 'file':
      return 'File';
    case 'audio':
      return 'Audio';
    case 'reply':
      return 'Reply';
    case 'clearMessagesForMe':
      return 'Clear for me';
    case 'clearAll':
      return 'Clear All';
    case 'sessionMessageRequests':
      return 'Message Requests';
    case 'done':
      return 'Done';
    case 'passwordSetDescription':
      return 'Your password has been set. Please keep it safe.';
    case 'passwordChangedDescription':
      return 'Your password has been changed. Please keep it safe.';
    case 'sessionPrivacy':
      return 'Privacy';
    case 'passwordIncorrect':
      return 'Incorrect password';
    case 'groupNoMessages':
      return 'You have no messages from {group_name}. Send a message to start the conversation!';
    case 'blockUnblockName':
      return 'Are you sure you want to unblock {name}?';
    case 'blockUnblock':
      return 'Unblock';
    case 'blockBlockedNone':
      return 'No blocked contacts';
    case 'nicknameSet':
      return 'Set Nickname';
    case 'save':
      return 'Save';
    case 'groupLeave':
      return 'Leave Group';
    case 'leave':
      return 'Leave';
    case 'disappearingMessagesFollowSetting':
      return 'Follow Setting';
    case 'groupMemberNew':
      return '{name} was invited to join the group.';
    case 'deleteMessageDeletedGlobally':
      return 'This message was deleted';
    case 'groupMemberNewTwo':
      return '{name} and {other_name} were invited to join the group.';
    case 'groupInviteYouAndOtherNew':
      return 'You and {other_name} were invited to join the group.';
    case 'disappearingMessagesSet':
      return '{name} has set messages to disappear {time} after they have been {disappearing_messages_type}.';
    case 'membersInvite':
      return 'Invite Contacts';
    case 'callsInProgress':
      return 'Call in progress';
    case 'callsYouCalled':
      return 'You called {name}';
    case 'callsCalledYou':
      return '{name} called you';
    case 'disappearingMessagesTurnedOffYou':
      return 'You turned off disappearing messages. Messages you send will no longer disappear.';
    case 'disappearingMessagesTurnedOff':
      return '{name} has turned disappearing messages off. Messages they send will no longer disappear.';
    case 'displayNameErrorDescription':
      return 'Please enter a display name';
    case 'conversationsDelete':
      return 'Delete Conversation';
    case 'recoveryPasswordHidePermanently':
      return 'Hide Recovery Password Permanently';
    case 'theContinue':
      return 'Continue';
    case 'yes':
      return 'Yes';
    case 'copied':
      return 'Copied';
    case 'linkPreviewsEnable':
      return 'Enable Link Previews';
    case 'linkPreviewsFirstDescription':
      return "Display previews for URLs you send and receive. This can be useful, however Session must contact linked websites to generate previews. You can always turn off link previews in Session's settings.";
    case 'enable':
      return 'Enable';
    case 'attachmentsAutoDownloadModalTitle':
      return 'Auto Download';
    case 'attachmentsAutoDownloadModalDescription':
      return 'Would you like to automatically download all files from {conversation_name}?';
    case 'download':
      return 'Download';
    case 'callsVoiceAndVideoBeta':
      return 'Voice and Video Calls (Beta)';
    case 'callsVoiceAndVideoModalDescription':
      return 'Your IP is visible to your call partner and a Session Technology Foundation server while using beta calls.';
    case 'blockDescription':
      return 'Are you sure you want to block {name}? Blocked users cannot send you message requests, group invites or call you.';
    case 'conversationsDeleteDescription':
      return 'Are you sure you want to delete your conversation with {name}? New messages from {name} will start a new conversation.';
    case 'noteToSelfHide':
      return 'Hide Note to Self';
    case 'noteToSelfHideDescription':
      return 'Are you sure you want to hide Note to Self?';
    case 'hide':
      return 'Hide';
    case 'accountIdCopied':
      return 'Account ID Copied';
    case 'shareAccountIdDescriptionCopied':
      return 'Share with your friends wherever you usually speak with them — then move the conversation here.';
    case 'disappearingMessagesTypeRead':
      return 'read';
    case 'disappearingMessagesTypeSent':
      return 'sent';
    case 'messageRequestsDelete':
      return 'Are you sure you want to delete this message request?';
    case 'messageRequestsClearAllExplanation':
      return 'Are you sure you want to clear all message requests and group invites?';
    case 'groupMembers':
      return 'Group Members';
    case 'you':
      return 'You';
    case 'clearDataAll':
      return 'Clear All Data';
    case 'clearDataAllDescription':
      return 'This will permanently delete your messages and contacts. Would you like to clear this device only, or delete your data from the network as well?';
    case 'clearDeviceDescription':
      return 'Are you sure you want to clear your device?';
    case 'qrView':
      return 'View QR';
    case 'recoveryPasswordView':
      return 'View Password';
    default:
      // returning nul means we don't have an expected string yet for this key.
      // This will make the test fail
      return null;
  }
}

test('Enforce localized strings return expected values', async () => {
  // Example usage
  const tsFiles = readTsFiles('.');

  const tokensToValidateSet: Set<MergedLocalizerTokens> = new Set();
  Object.entries(tsFiles).forEach(([_, content]) => {
    const tokens = extractAllTokens(content);

    tokens.forEach((t) => tokensToValidateSet.add(t));
  });

  const unknownKeys: Array<MergedLocalizerTokens> = [];

  let atLeastOneFailed = false;

  const tokensToValidate = [...tokensToValidateSet];
  for (let index = 0; index < tokensToValidate.length; index++) {
    const token = tokensToValidate[index];

    if (isPluralToken(token)) {
      const counts = [1, 3];
      for (let countIndex = 0; countIndex < counts.length; countIndex++) {
        const count = counts[countIndex];
        const expectedStr = getExpectedStringFromKey({ key: token, count });

        const foundStr = englishStrippedStr(token)
          .withArgs({ count })
          .toString();
        if (!expectedStr) {
          unknownKeys.push(token);
          return;
        }
        if (foundStr !== expectedStr) {
          atLeastOneFailed = true;
        }
      }
    } else {
      const expectedStr = getExpectedStringFromKey({ key: token });
      const foundStr = englishStrippedStr(token).toString();
      if (!expectedStr) {
        unknownKeys.push(token);
        continue;
      }
      if (foundStr !== expectedStr) {
        console.log(
          `${token} expected:\n"${expectedStr}" but got:\n"${foundStr}"`,
        );
        atLeastOneFailed = true;
      }
    }
  }
  console.log(`unknownKeys: [${unknownKeys.join(', ')}]`);
  if (unknownKeys.length) {
    atLeastOneFailed = true;
  }

  if (atLeastOneFailed) {
    throw new Error(
      'Some strings/keys did not match what they were expected to be',
    );
  }
});
