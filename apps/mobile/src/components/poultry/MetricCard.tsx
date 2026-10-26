// MetricCard — a number with meaning, not a raw statistic (AGENTS.md #9,
// Product Direction §4). Shows label, large value, unit, a one-line
// "meaning" (e.g. "4.2% above expected"), and a status chip.
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/poultry/StatusChip';
import type { StatusKey } from '@/theme/tokens';

export interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  status?: StatusKey;
  meaning?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  status,
  meaning,
}: MetricCardProps): React.ReactElement {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}${unit ? ' ' + unit : ''}${
        meaning ? '. ' + meaning : ''
      }`}
      className="rounded-card border border-surface-border bg-surface-card p-4"
    >
      <Text className="text-label text-ink-muted">{label}</Text>
      <View className="mt-1 flex-row flex-wrap items-baseline">
        <Text className="text-display text-ink-primary">{value}</Text>
        {unit ? (
          <Text className="ml-1 text-body text-ink-muted">{unit}</Text>
        ) : null}
      </View>
      {meaning ? (
        <Text className="mt-1 text-body text-ink-muted">{meaning}</Text>
      ) : null}
      {status ? (
        <View className="mt-3">
          <StatusChip status={status} />
        </View>
      ) : null}
    </View>
  );
}
