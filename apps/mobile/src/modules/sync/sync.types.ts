export interface SyncStatusState {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  pendingCount: number;
}

export const defaultSyncStatusState: SyncStatusState = {
  lastSyncedAt: null,
  isSyncing: false,
  pendingCount: 0,
};
