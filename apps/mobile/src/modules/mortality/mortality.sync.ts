import type { ChangeRecord } from '../../core/sync/types';

export interface MortalitySyncHandlerConfig {
  resource: 'mortality-entry';
}

export const mortalitySync = {
  resource: 'mortality-entry' as const,
  apply: (record: ChangeRecord) => record,
};
