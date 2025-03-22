import {
  localize,
  type MergedLocalizerTokens,
} from '../localization/localeTools';

export function englishStrippedStr<T extends MergedLocalizerTokens>(token: T) {
  return localize(token).strip();
}
