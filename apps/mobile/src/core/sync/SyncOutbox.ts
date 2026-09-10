import type { ChangeRecord, SyncPayload } from './types';
import { loadJson, saveJson, storageKeys } from '../db/persistedStore';

let pendingQueue: ChangeRecord[] | null = null;
let hydratePromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<ChangeRecord[]> {
  if (pendingQueue) return pendingQueue;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      pendingQueue = await loadJson<ChangeRecord[]>(storageKeys.syncOutbox, []);
    })();
  }
  await hydratePromise;
  return pendingQueue ?? [];
}

async function persist(queue: ChangeRecord[]): Promise<void> {
  pendingQueue = queue;
  await saveJson(storageKeys.syncOutbox, queue);
}

export class SyncOutbox {
  static async enqueue(change: ChangeRecord): Promise<void> {
    const queue = await ensureLoaded();
    if (queue.some((entry) => entry.id === change.id)) return;
    await persist([...queue, change]);
  }

  static async readPending(): Promise<SyncPayload> {
    const queue = await ensureLoaded();
    return { changes: [...queue] };
  }

  static async markSynced(changeId: string): Promise<void> {
    const queue = await ensureLoaded();
    await persist(queue.filter((entry) => entry.id !== changeId));
  }

  /** Test / reset helper — clears durable outbox. */
  static async clear(): Promise<void> {
    await persist([]);
  }
}
