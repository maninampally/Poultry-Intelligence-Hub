// AlertCard — surfaces a change with its REASON always visible, plus up to
// three actions (Product Direction §6). Each action is >= 48px tall.
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { StatusChip } from '@/components/poultry/StatusChip';
import type { StatusKey } from '@/theme/tokens';

export interface AlertAction {
  label: string;
  onPress: () => void;
}

export interface AlertCardProps {
  severity: StatusKey;
  title: string;
  reason: string;
  actions?: AlertAction[];
}

export function AlertCard({
  severity,
  title,
  reason,
  actions = [],
}: AlertCardProps): React.ReactElement {
  const shown = actions.slice(0, 3);
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${reason}`}
      className="rounded-card border border-surface-border bg-surface-card p-4"
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-title text-ink-primary">{title}</Text>
        <StatusChip status={severity} />
      </View>
      {/* Reason is always visible, never truncated (AGENTS.md rule #3). */}
      <Text className="mt-2 text-body text-ink-muted">{reason}</Text>
      {shown.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {shown.map((a) => (
            <Pressable
              key={a.label}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              onPress={a.onPress}
              className="min-h-touch justify-center rounded-control border border-brand-700 px-4 py-2"
            >
              <Text className="text-label text-brand-700">{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
