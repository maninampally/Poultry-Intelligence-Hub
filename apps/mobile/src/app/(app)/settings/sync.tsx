import type { ReactNode } from 'react';
import { PageLayout } from '../../../components/templates/PageLayout';
import { StatusCard } from '../../../components/molecules/StatusCard';

export default function SyncSettingsRoute(): ReactNode {
  return (
    <PageLayout title="Sync settings">
      <StatusCard title="Last sync" value="Just now" />
      <StatusCard title="Pending" value="0" />
    </PageLayout>
  );
}
