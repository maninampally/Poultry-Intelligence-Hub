// Daily records repository. Every save writes the record AND a sync_queue
// row in ONE transaction (AGENTS.md rule #6). UUIDs are generated on device
// so records are stable across offline/online.
import { getDb } from '@/lib/db';

export interface DailyRecordInput {
  id: string; // uuid generated on device
  flockId: string;
  recordDate: string; // YYYY-MM-DD
  feedKg?: number | null;
  waterL?: number | null;
  deaths?: number | null;
  avgWeightKg?: number | null;
  notes?: string | null;
  photoUri?: string | null;
}

export interface DailyRecordRow extends DailyRecordInput {
  createdAt: string;
  updatedAt: string;
  syncStatus: 'saved' | 'pending' | 'syncing' | 'synced' | 'failed';
}

/** Upsert a daily record (one per flock+date) + enqueue a sync op atomically. */
export async function saveDailyRecord(input: DailyRecordInput): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const payload = JSON.stringify(input);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO daily_records
         (id, flock_id, record_date, feed_kg, water_l, deaths,
          avg_weight_kg, notes, photo_uri, created_at, updated_at, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?, 'pending')
       ON CONFLICT (flock_id, record_date) DO UPDATE SET
         feed_kg = excluded.feed_kg,
         water_l = excluded.water_l,
         deaths = excluded.deaths,
         avg_weight_kg = excluded.avg_weight_kg,
         notes = excluded.notes,
         photo_uri = excluded.photo_uri,
         updated_at = excluded.updated_at,
         sync_status = 'pending'`,
      [
        input.id,
        input.flockId,
        input.recordDate,
        input.feedKg ?? null,
        input.waterL ?? null,
        input.deaths ?? null,
        input.avgWeightKg ?? null,
        input.notes ?? null,
        input.photoUri ?? null,
        now,
        now,
      ],
    );

    await db.runAsync(
      `INSERT INTO sync_queue
         (id, entity, entity_id, operation, payload, attempts, created_at)
       VALUES (?, 'daily_records', ?, 'upsert', ?, 0, ?)`,
      [`${input.id}:${now}`, input.id, payload, now],
    );
  });
}

/** List daily records for a flock, newest first. */
export async function listDailyRecords(
  flockId: string,
): Promise<DailyRecordRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM daily_records WHERE flock_id = ? ORDER BY record_date DESC`,
    [flockId],
  );
  return rows.map((r) => ({
    id: String(r.id),
    flockId: String(r.flock_id),
    recordDate: String(r.record_date),
    feedKg: (r.feed_kg as number | null) ?? null,
    waterL: (r.water_l as number | null) ?? null,
    deaths: (r.deaths as number | null) ?? null,
    avgWeightKg: (r.avg_weight_kg as number | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    photoUri: (r.photo_uri as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    syncStatus: r.sync_status as DailyRecordRow['syncStatus'],
  }));
}

/** Count pending sync operations (for the sync status UI). */
export async function pendingSyncCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sync_queue`,
  );
  return row?.n ?? 0;
}
