import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { englishStrippedStr } from '../locale/localizedString';
import {
  isPluralToken,
  type MergedLocalizerTokens,
  type PluralLocalizerTokens,
  type SimpleLocalizerTokens,
} from '../localization/localeTools';

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
      return 'Unblock this contact to send a message.';
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
