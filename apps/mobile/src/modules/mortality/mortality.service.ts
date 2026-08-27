import { SyncOutbox } from '../../core/sync/SyncOutbox';
import { addMortalityEntry } from '../../core/db/store';
import { appendMortalityEntry } from './mortality.store';
import type { MortalityEntry } from './mortality.types';

export interface CreateMortalityParams {
  batchId: string;
  shedId: string;
  count: number;
  cause: MortalityEntry['cause'];
}

const generateUuid = (): string => {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

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
      id: generateUuid(),
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
      operationId: generateUuid(),
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
