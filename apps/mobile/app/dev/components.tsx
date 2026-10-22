// Dev preview: every base component in every state (FIRST_PROMPT.md).
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  AlertCard,
  MetricCard,
  StatusChip,
  SyncChip,
  type SyncState,
} from '@/components/poultry';
import type { StatusKey } from '@/theme/tokens';

const STATUSES: StatusKey[] = ['normal', 'watch', 'act'];
const SYNC_STATES: SyncState[] = ['saved', 'pending', 'syncing', 'synced', 'failed'];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View className="mb-6">
      <Text className="mb-3 text-title text-ink-primary">{title}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

export default function ComponentsPreview(): React.ReactElement {
  return (
    <ScrollView
      className="flex-1 bg-surface-background"
      contentContainerClassName="p-4"
    >
      <Section title="StatusChip">
        <View className="flex-row flex-wrap gap-2">
          {STATUSES.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </View>
      </Section>

      <Section title="SyncChip">
        <View className="flex-row flex-wrap gap-2">
          {SYNC_STATES.map((s) => (
            <SyncChip key={s} state={s} onRetry={() => undefined} />
          ))}
        </View>
      </Section>

      <Section title="MetricCard">
        <MetricCard
          label="Feed consumption"
          value="1,240"
          unit="kg"
          status="watch"
          meaning="4.2% above expected"
        />
        <MetricCard
          label="Average weight"
          value="1.82"
          unit="kg"
          status="normal"
          meaning="+3.1% vs target"
        />
        <MetricCard
          label="Mortality"
          value="12"
          unit="birds"
          status="act"
          meaning="Above the recent trend"
        />
      </Section>

      <Section title="AlertCard">
        <AlertCard
          severity="watch"
          title="Feed above expected"
          reason="Feed consumption is 7% above the recent expected level."
          actions={[
            { label: 'View trend', onPress: () => undefined },
            { label: 'Record observation', onPress: () => undefined },
            { label: 'Ask AI', onPress: () => undefined },
          ]}
        />
        <AlertCard
          severity="act"
          title="Mortality spike"
          reason="Mortality increased compared with the recent flock trend."
          actions={[{ label: 'View trend', onPress: () => undefined }]}
        />
      </Section>
    </ScrollView>
  );
}
