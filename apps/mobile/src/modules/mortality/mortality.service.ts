import { SyncOutbox } from '../../core/sync/SyncOutbox';
import { addMortalityEntry, addMortalityEntryDurable, hydrateLocalMortality, listMortality } from '../../core/db/store';
import { appendMortalityEntry, useMortalityStore } from './mortality.store';
import { generateId } from '../../core/utils/id';
import type { MortalityEntry } from './mortality.types';

export interface CreateMortalityParams {
  batchId: string;
  shedId: string;
  count: number;
  cause: MortalityEntry['cause'];
}

export interface CorrectMortalityParams {
  originalEventId: string;
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
  supersedesEventId?: string;
}): MortalityEntry => ({
  id: row.id,
  batchId: row.batchId,
  shedId: row.shedId,
  count: row.count,
  cause: (['respiratory', 'heat', 'ascites', 'unknown', 'other'].includes(row.cause)
    ? row.cause
    : 'unknown') as MortalityEntry['cause'],
  occurredAt: row.occurredAt,
  supersedesEventId: row.supersedesEventId,
});

export class MortalityService {
  static async hydrate(): Promise<void> {
    await hydrateLocalMortality();
  }

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

  /**
   * Compensating correction: original event stays; new event carries supersedesEventId.
   * Metrics rebuild on the server ignores the superseded original.
   */
  static async correct(params: CorrectMortalityParams): Promise<MortalityEntry> {
    await hydrateLocalMortality();

    const entry: MortalityEntry = {
      id: generateId(),
      batchId: params.batchId,
      shedId: params.shedId,
      count: params.count,
      cause: params.cause,
      occurredAt: new Date().toISOString(),
      supersedesEventId: params.originalEventId,
    };

    appendMortalityEntry(entry);
    await addMortalityEntryDurable(entry);

    await SyncOutbox.enqueue({
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
        supersedesEventId: params.originalEventId,
      },
      occurredAt: entry.occurredAt,
    });

    return entry;
  }
}
