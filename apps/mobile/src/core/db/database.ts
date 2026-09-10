import { hydrateLocalMortality } from './store';
import { SyncCursor } from '../sync/SyncCursor';
import { SyncOutbox } from '../sync/SyncOutbox';

export type DbRecord = Record<string, unknown>;

export interface DatabaseLike {
  write<T>(callback: () => Promise<T> | T): Promise<T>;
  get<T>(tableName: string): { create: (builder: (record: T) => void) => Promise<T> };
}

/**
 * Local DB facade. Durable state (outbox, cursor, mortality) lives in
 * AsyncStorage via persistedStore — this facade hydrates that state on open.
 */
export const database: DatabaseLike = {
  async write<T>(callback: () => Promise<T> | T): Promise<T> {
    return await callback();
  },
  get<T>(_tableName: string) {
    return {
      create: async (builder: (record: T) => void) => {
        const record = {} as T;
        builder(record);
        return record;
      },
    };
  },
};

/** Load durable outbox/cursor/mortality before app screens or sync run. */
export async function openLocalDatabase(): Promise<void> {
  await Promise.all([
    hydrateLocalMortality(),
    SyncOutbox.readPending(),
    SyncCursor.load(),
  ]);
}
