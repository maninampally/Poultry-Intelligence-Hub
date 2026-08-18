import type { ReactNode } from 'react';
import { StatusCard } from '../../../components/molecules/StatusCard';
import { PageLayout } from '../../../components/templates/PageLayout';

export const MortalityHistoryScreen = (): ReactNode => (
  <PageLayout title="Mortality history">
    <StatusCard title="This week" value="12 birds" />
    <StatusCard title="Mortality rate" value="1.8%" />
  </PageLayout>
);
