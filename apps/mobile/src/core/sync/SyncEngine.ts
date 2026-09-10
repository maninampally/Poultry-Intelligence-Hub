import { SyncCursor } from './SyncCursor';
import { SyncOutbox } from './SyncOutbox';
import { tokenStore } from '../auth/token.store';
import { createApiClient } from '../api/client';
import { apiBaseUrl } from '../api/config';
import { addMortalityEntry, hydrateLocalMortality } from '../db/store';
import { upsertMortalityEntry } from '../../modules/mortality/mortality.store';

export type SyncDirection = 'pull' | 'push';

type MortalityPayload = {
  batchId: string;
  shedId: string;
  count: number;
  cause?: string;
  shift?: string;
  supersedesEventId?: string;
};

export class SyncEngine {
  static running = false;

  static async syncNow(direction: SyncDirection = 'pull'): Promise<void> {
    if (this.running) return;

    this.running = true;
    try {
      await hydrateLocalMortality();
      const cursor = await SyncCursor.load();
      const pending = await SyncOutbox.readPending();
      const token = await tokenStore.get();
      if (!token) throw new Error('Cannot sync without an authenticated session');
      const api = createApiClient({ baseUrl: apiBaseUrl });

      if (pending.changes.length > 0) {
        const response = await api.post<{ results: Array<{ operation_id: string; accepted: boolean }> }>(
          '/v1/sync/push',
          {
            changes: pending.changes.map((change) => {
              const payload = change.payload as MortalityPayload;
              return {
                operation_id: change.operationId,
                idempotency_key: change.idempotencyKey,
                resource: change.resource,
                action: change.action,
                entity_id: change.entityId,
                batch_id: payload.batchId,
                shed_id: payload.shedId,
                occurred_at: change.occurredAt,
                count: payload.count,
                cause: payload.cause,
                shift: payload.shift ?? 'unspecified',
                supersedes_event_id: payload.supersedesEventId ?? null,
              };
            }),
          },
          token,
        );
        for (const result of response.results) {
          if (result.accepted) {
            const change = pending.changes.find((entry) => entry.operationId === result.operation_id);
            if (change) await SyncOutbox.markSynced(change.id);
          }
        }
      }

      if (direction === 'pull' || direction === 'push') {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
        const response = await api.get<{
          events: Array<{
            event_id: string;
            event_type: string;
            batch_id: string | null;
            occurred_at: string;
            payload: {
              shed_id?: string;
              count?: number;
              cause?: string;
              shift?: string;
              supersedes_event_id?: string;
            };
          }>;
          next_cursor: string | null;
        }>(`/v1/sync/pull${query}`, token);
        for (const event of response.events) {
          if (event.event_type !== 'mortality.logged' || !event.batch_id || !event.payload.shed_id) continue;
          const entry = {
            id: event.event_id,
            batchId: event.batch_id,
            shedId: event.payload.shed_id,
            count: event.payload.count ?? 0,
            cause: ['respiratory', 'heat', 'ascites', 'unknown', 'other'].includes(event.payload.cause ?? '')
              ? (event.payload.cause as 'respiratory' | 'heat' | 'ascites' | 'unknown' | 'other')
              : 'unknown',
            occurredAt: event.occurred_at,
            supersedesEventId: event.payload.supersedes_event_id,
          };
          addMortalityEntry(entry);
          upsertMortalityEntry(entry);
        }
        if (response.next_cursor) await SyncCursor.save(response.next_cursor);
      }
    } finally {
      this.running = false;
    }
  }
}
