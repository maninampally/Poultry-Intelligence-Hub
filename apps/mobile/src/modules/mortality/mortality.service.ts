import { SyncOutbox } from '../../core/sync/SyncOutbox';
import { addMortalityEntry, listMortality } from '../../core/db/store';
import { appendMortalityEntry, useMortalityStore } from './mortality.store';
import { generateId } from '../../core/utils/id';
import type { MortalityEntry } from './mortality.types';

export interface CreateMortalityParams {
  batchId: string;
  shedId: string;
  count: number;
  cause: MortalityEntry['cause'];
}

const toEntry = (row: {
  id: string;
  batchId: string;
  shedId: string;
  count: number;
  cause: string;
  occurredAt: string;
}): MortalityEntry => ({
  id: row.id,
  batchId: row.batchId,
  shedId: row.shedId,
  count: row.count,
  cause: (['respiratory', 'heat', 'ascites', 'unknown', 'other'].includes(row.cause)
    ? row.cause
    : 'unknown') as MortalityEntry['cause'],
  occurredAt: row.occurredAt,
});

export class MortalityService {
  static listRecent(): MortalityEntry[] {
    const fromStore = useMortalityStore().entries.map(toEntry);
    if (fromStore.length > 0) return fromStore;
    return listMortality().map(toEntry);
  }

  static create(params: CreateMortalityParams): MortalityEntry {
    const entry: MortalityEntry = {
      id: generateId(),
      batchId: params.batchId,
      shedId: params.shedId,
      count: params.count,
      cause: params.cause,
      occurredAt: new Date().toISOString(),
    };

    appendMortalityEntry(entry);
    addMortalityEntry(entry);

    void SyncOutbox.enqueue({
      id: entry.id,
      operationId: generateId(),
      idempotencyKey: entry.id,
      resource: 'mortality-entry',
      action: 'create',
      entityId: entry.id,
      payload: {
        batchId: entry.batchId,
        shedId: entry.shedId,
        count: entry.count,
        cause: entry.cause,
      },
      occurredAt: entry.occurredAt,
    });

    return entry;
  }
}
