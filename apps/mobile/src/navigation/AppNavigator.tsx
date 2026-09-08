import { useState, type ReactNode } from 'react';
import { Button } from '../components/atoms/Button';
import { StatusCard } from '../components/molecules/StatusCard';
import { PageLayout } from '../components/templates/PageLayout';
import { BatchService } from '../modules/batch/batch.service';
import { FarmService } from '../modules/farm/farm.service';
import { MortalityService } from '../modules/mortality/mortality.service';
import { MortalityLogScreen } from '../modules/mortality/screens/MortalityLogScreen';
import { SyncService } from '../modules/sync/sync.service';

export const AppNavigator = (): ReactNode => {
  const [view, setView] = useState<'dashboard' | 'mortality'>('dashboard');
  const [, bump] = useState(0);

  const batches = BatchService.list();
  const farms = FarmService.list();
  const sync = SyncService.getStatus();
  const mortality = MortalityService.listRecent();

  if (view === 'mortality') {
    return (
      <>
        <Button
          label="Back to dashboard"
          onPress={() => {
            bump((n) => n + 1);
            setView('dashboard');
          }}
        />
        <MortalityLogScreen />
      </>
    );
  }

  return (
    <PageLayout title="Dashboard">
      <StatusCard title="Active batches" value={`${batches.length}`} />
      <StatusCard title="Farms" value={`${farms.length}`} />
      <StatusCard title="Sync status" value={sync.isSyncing ? 'Syncing' : 'Healthy'} />
      <StatusCard title="Recent mortality" value={`${mortality.length}`} />
      <Button label="Open mortality log" onPress={() => setView('mortality')} />
    </PageLayout>
  );
};
