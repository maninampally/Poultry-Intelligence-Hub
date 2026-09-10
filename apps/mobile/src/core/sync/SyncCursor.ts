import { loadJson, saveJson, storageKeys } from '../db/persistedStore';

let cached: string | null | undefined;
let hydratePromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<string | null> {
  if (cached !== undefined) return cached;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      cached = await loadJson<string | null>(storageKeys.syncCursor, null);
    })();
  }
  await hydratePromise;
  return cached ?? null;
}

export class SyncCursor {
  static async load(): Promise<string | null> {
    return ensureLoaded();
  }

  static async save(cursor: string): Promise<void> {
    await ensureLoaded();
    cached = cursor;
    await saveJson(storageKeys.syncCursor, cursor);
  }

  /** Test / reset helper — clears durable cursor. */
  static async clear(): Promise<void> {
    cached = null;
    await saveJson(storageKeys.syncCursor, null);
  }
}
