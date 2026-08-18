export interface SyncItem {
  entity: 'farm' | 'batch' | 'mortality' | 'feed' | 'weight' | 'cost';
  id: string;
  payload: Record<string, unknown>;
  pendingSync: boolean;
}

export interface SyncEnvelope {
  userId: string;
  deviceId: string;
  items: SyncItem[];
  syncToken?: string;
}

export const buildSyncEnvelope = (userId: string, deviceId: string, items: SyncItem[]): SyncEnvelope => ({
  userId,
  deviceId,
  items,
});
