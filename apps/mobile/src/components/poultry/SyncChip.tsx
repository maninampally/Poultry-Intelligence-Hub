// SyncChip — shows a record's sync state (AGENTS.md rule #6). Every state
// has a distinct icon + word; 'failed' exposes a retry affordance.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type SyncState = 'saved' | 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncChipProps {
  state: SyncState;
  onRetry?: () => void;
}

const GLYPH: Record<SyncState, string> = {
  saved: '\u2601', // cloud (saved on device)
  pending: '\u23F3', // hourglass
  syncing: '\u21BB', // clockwise arrow
  synced: '\u2713', // check
  failed: '\u2717', // cross
};

const WORD_KEY: Record<SyncState, string> = {
  saved: 'sync.saved',
  pending: 'sync.pending',
  syncing: 'sync.syncing',
  synced: 'sync.synced',
  failed: 'sync.failed',
};

const CLASS: Record<SyncState, { bg: string; fg: string }> = {
  saved: { bg: 'bg-surface-border', fg: 'text-ink-muted' },
  pending: { bg: 'bg-watch-bg', fg: 'text-watch-fg' },
  syncing: { bg: 'bg-brand-100', fg: 'text-brand-700' },
  synced: { bg: 'bg-normal-bg', fg: 'text-normal-fg' },
  failed: { bg: 'bg-act-bg', fg: 'text-act-fg' },
};

export function SyncChip({ state, onRetry }: SyncChipProps): React.ReactElement {
  const { t } = useTranslation();
  const word = t(WORD_KEY[state]);
  const cls = CLASS[state];

  const content = (
    <View
      className={`flex-row items-center self-start rounded-full px-3 py-1 ${cls.bg}`}
    >
      <Text className={`mr-1 text-caption ${cls.fg}`}>{GLYPH[state]}</Text>
      <Text className={`text-caption ${cls.fg}`}>{word}</Text>
      {state === 'failed' ? (
        <Text className={`ml-2 text-caption underline ${cls.fg}`}>
          {t('common.retry')}
        </Text>
      ) : null}
    </View>
  );

  if (state === 'failed' && onRetry) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${word}. ${t('common.retry')}`}
        onPress={onRetry}
        className="min-h-touch justify-center"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="text" accessibilityLabel={`Sync: ${word}`}>
      {content}
    </View>
  );
}
