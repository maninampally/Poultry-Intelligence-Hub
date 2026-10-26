// StatusChip — status is never color alone (AGENTS.md rule #5).
// Each variant pairs a background/foreground token color with an icon
// glyph and a word.
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { StatusKey } from '@/theme/tokens';

export interface StatusChipProps {
  status: StatusKey;
}

// Icon glyph per status (text-based so no asset dependency). Paired with a
// word for accessibility and color-blind safety.
const GLYPH: Record<StatusKey, string> = {
  normal: '\u2713', // check
  watch: '\u26A0', // warning
  act: '\u25C9', // target/alert
};

const WORD_KEY: Record<StatusKey, string> = {
  normal: 'common.normal',
  watch: 'common.watch',
  act: 'common.act',
};

const CLASS: Record<StatusKey, { bg: string; fg: string }> = {
  normal: { bg: 'bg-normal-bg', fg: 'text-normal-fg' },
  watch: { bg: 'bg-watch-bg', fg: 'text-watch-fg' },
  act: { bg: 'bg-act-bg', fg: 'text-act-fg' },
};

export function StatusChip({ status }: StatusChipProps): React.ReactElement {
  const { t } = useTranslation();
  const word = t(WORD_KEY[status]);
  const cls = CLASS[status];
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${word}`}
      className={`flex-row items-center self-start rounded-full px-3 py-1 ${cls.bg}`}
    >
      <Text className={`mr-1 text-label ${cls.fg}`}>{GLYPH[status]}</Text>
      <Text className={`text-label ${cls.fg}`}>{word}</Text>
    </View>
  );
}
