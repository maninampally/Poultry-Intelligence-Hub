import { SyncCursor } from './SyncCursor';
import { SyncOutbox } from './SyncOutbox';

export type SyncDirection = 'pull' | 'push';

export class SyncEngine {
  static running = false;

  static async syncNow(direction: SyncDirection = 'pull'): Promise<void> {
    if (this.running) return;

    this.running = true;
    try {
      const cursor = await SyncCursor.load();
      const pending = await SyncOutbox.readPending();

      if (direction === 'pull') {
        void cursor;
      }

      for (const change of pending.changes) {
        await SyncOutbox.markSynced(change.id);
      }
    } finally {
      this.running = false;
    }
  }
}
