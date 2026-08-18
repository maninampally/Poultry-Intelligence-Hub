import type { ReactNode } from 'react';
import { PageLayout } from '../../components/templates/PageLayout';
import { StatusCard } from '../../components/molecules/StatusCard';

export default function DashboardRoute(): ReactNode {
  return (
    <PageLayout title="Dashboard">
      <StatusCard title="Active batches" value="3" />
      <StatusCard title="Sync status" value="Healthy" />
    </PageLayout>
  );
}
