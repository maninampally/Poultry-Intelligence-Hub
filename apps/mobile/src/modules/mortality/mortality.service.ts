import { SyncOutbox } from '../../core/sync/SyncOutbox';
import { addMortalityEntry } from '../../core/db/store';
import { generateUlid } from '../../core/utils/ulid';
import { appendMortalityEntry } from './mortality.store';
import type { MortalityEntry } from './mortality.types';

export interface CreateMortalityParams {
  batchId: string;
  shedId: string;
  count: number;
  cause: MortalityEntry['cause'];
}

export class MortalityService {
  static listRecent(): MortalityEntry[] {
    return [
      {
        id: 'mortality-1',
        batchId: 'batch-1',
        shedId: 'shed-1',
        count: 3,
        cause: 'unknown',
        occurredAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'mortality-2',
        batchId: 'batch-2',
        shedId: 'shed-3',
        count: 2,
        cause: 'heat',
        occurredAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }

  static create(params: CreateMortalityParams): MortalityEntry {
    const entry: MortalityEntry = {
      id: generateUlid(),
      batchId: params.batchId,
      shedId: params.shedId,
      count: params.count,
      cause: params.cause,
      occurredAt: new Date().toISOString(),
    };

    appendMortalityEntry({
      id: entry.id,
      batchId: entry.batchId,
      shedId: entry.shedId,
      count: entry.count,
      cause: entry.cause,
      occurredAt: entry.occurredAt,
    });

    addMortalityEntry({
      id: entry.id,
      batchId: entry.batchId,
      shedId: entry.shedId,
      count: entry.count,
      cause: entry.cause,
      occurredAt: entry.occurredAt,
    });

    void SyncOutbox.enqueue({
      id: entry.id,
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
