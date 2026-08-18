import type { ChangeRecord, SyncPayload } from './types';

const pendingQueue: ChangeRecord[] = [];

export class SyncOutbox {
  static async enqueue(change: ChangeRecord): Promise<void> {
    pendingQueue.push(change);
  }

  static async readPending(): Promise<SyncPayload> {
    return { changes: [...pendingQueue] };
  }

  static async markSynced(changeId: string): Promise<void> {
    const index = pendingQueue.findIndex((entry) => entry.id === changeId);
    if (index >= 0) pendingQueue.splice(index, 1);
  }
}
