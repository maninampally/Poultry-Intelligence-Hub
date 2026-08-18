import { defaultSyncStatusState, type SyncStatusState } from './sync.types';

export class SyncService {
  static getStatus(): SyncStatusState {
    return {
      ...defaultSyncStatusState,
      lastSyncedAt: new Date().toISOString(),
      pendingCount: 2,
      isSyncing: false,
    };
  }

  static async runPull(): Promise<void> {
    await Promise.resolve();
  }

  static async runPush(): Promise<void> {
    await Promise.resolve();
  }
}
