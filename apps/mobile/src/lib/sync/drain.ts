// Drain local sync_queue → POST /api/v1/sync/push (Phase 1).
// Offline-first: rows stay queued until the server accepts or duplicates them.
import { getDb } from '@/lib/db';

import type {
  DrainResult,
  PushResponse,
  SyncConfig,
  SyncQueueRow,
} from './types';

const BATCH_SIZE = 50;

async function listPending(limit: number): Promise<SyncQueueRow[]> {
  const db = await getDb();
  return db.getAllAsync<SyncQueueRow>(
    `SELECT id, entity, entity_id, operation, payload, attempts
     FROM sync_queue
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
}

async function removeQueueRows(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `DELETE FROM sync_queue WHERE id IN (${placeholders})`,
    ids,
  );
}

async function bumpAttempts(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE sync_queue
     SET attempts = attempts + 1, last_error = ?
     WHERE id = ?`,
    [error.slice(0, 500), id],
  );
}

async function markRecordsSynced(entityIds: string[]): Promise<void> {
  if (entityIds.length === 0) return;
  const db = await getDb();
  const placeholders = entityIds.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE daily_records
     SET sync_status = 'synced'
     WHERE id IN (${placeholders})`,
    entityIds,
  );
}

async function markRecordsFailed(entityIds: string[]): Promise<void> {
  if (entityIds.length === 0) return;
  const db = await getDb();
  const placeholders = entityIds.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE daily_records
     SET sync_status = 'failed'
     WHERE id IN (${placeholders})`,
    entityIds,
  );
}

/** Push up to one batch of pending sync_queue rows to the API. */
export async function drainSyncQueue(config: SyncConfig): Promise<DrainResult> {
  const pending = await listPending(BATCH_SIZE);
  if (pending.length === 0) {
    return { pushed: 0, accepted: 0, duplicates: 0, failed: 0, errors: [] };
  }

  const operations = pending.map((row) => {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(row.payload) as Record<string, unknown>;
    } catch {
      data = {};
    }
    return {
      idempotency_key: row.id,
      table_name: row.entity,
      operation: row.operation,
      record_id: row.entity_id,
      data,
    };
  });

  const url = `${config.apiBaseUrl.replace(/\/$/, '')}/api/v1/sync/push`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_id: config.orgId,
        device_id: config.deviceId,
        operations,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    for (const row of pending) {
      await bumpAttempts(row.id, message);
    }
    await markRecordsFailed(pending.map((r) => r.entity_id));
    return {
      pushed: pending.length,
      accepted: 0,
      duplicates: 0,
      failed: pending.length,
      errors: [message],
    };
  }

  if (!response.ok) {
    const text = await response.text();
    const message = `HTTP ${response.status}: ${text.slice(0, 200)}`;
    for (const row of pending) {
      await bumpAttempts(row.id, message);
    }
    await markRecordsFailed(pending.map((r) => r.entity_id));
    return {
      pushed: pending.length,
      accepted: 0,
      duplicates: 0,
      failed: pending.length,
      errors: [message],
    };
  }

  const body = (await response.json()) as PushResponse;
  const byKey = new Map(body.results.map((r) => [r.idempotency_key, r]));

  const removeIds: string[] = [];
  const syncedEntityIds: string[] = [];
  const failedEntityIds: string[] = [];
  const errors: string[] = [];

  for (const row of pending) {
    const result = byKey.get(row.id);
    if (!result) {
      await bumpAttempts(row.id, 'missing result from server');
      failedEntityIds.push(row.entity_id);
      errors.push(`${row.id}: missing result`);
      continue;
    }
    if (result.status === 'accepted' || result.status === 'duplicate') {
      removeIds.push(row.id);
      syncedEntityIds.push(row.entity_id);
    } else {
      await bumpAttempts(row.id, result.error ?? 'failed');
      failedEntityIds.push(row.entity_id);
      if (result.error) errors.push(`${row.id}: ${result.error}`);
    }
  }

  await removeQueueRows(removeIds);
  await markRecordsSynced(syncedEntityIds);
  await markRecordsFailed(failedEntityIds);

  return {
    pushed: pending.length,
    accepted: body.summary.accepted,
    duplicates: body.summary.duplicates,
    failed: body.summary.failed,
    errors,
  };
}

/** Register this install as a sync device; returns server device_id. */
export async function registerSyncDevice(
  config: Omit<SyncConfig, 'deviceId'> & { name?: string; platform?: string },
): Promise<string> {
  const url = `${config.apiBaseUrl.replace(/\/$/, '')}/api/v1/sync/register-device`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      org_id: config.orgId,
      name: config.name ?? 'mobile',
      platform: config.platform ?? 'expo',
    }),
  });
  if (!response.ok) {
    throw new Error(`register-device failed: HTTP ${response.status}`);
  }
  const body = (await response.json()) as { device_id: string };
  return body.device_id;
}
