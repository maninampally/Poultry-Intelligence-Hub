import { runQuery } from "../sqlLoader";

export interface MortalityLog {
  id: string;
  batchId: string;
  shedId: string;
  date: Date;
  shift: "morning" | "evening";
  count: number;
  cause: string;
  notes: string | null;
  photoUrl: string | null;
  createdAt: Date;
}

export interface BatchMetricsRow {
  batchId: string;
  tenantId: string | null;
  placementCount: number;
  cumulativeMortality: number;
  liveBirdCount: number;
  mortalityPercent: number;
  lastProcessedEventId: string | null;
  projectionStatus: string;
  lastCalculatedAt: Date | null;
}

export async function insertMortality(log: {
  batchId: string;
  shedId: string;
  date: Date;
  shift: "morning" | "evening";
  count: number;
  cause: string;
  notes?: string | null;
  photoUrl?: string | null;
}): Promise<MortalityLog> {
  const rows = await runQuery<MortalityLog>("mortality/insert-mortality.sql", [
    log.batchId,
    log.shedId,
    log.date,
    log.shift,
    log.count,
    log.cause,
    log.notes ?? null,
    log.photoUrl ?? null,
  ]);
  return rows[0];
}

/**
 * Prefer the event ledger (FastAPI writes). Fall back to legacy mortality_logs
 * so the web dashboard still works during dual-stack.
 */
export async function listMortalityByBatch(batchId: string): Promise<MortalityLog[]> {
  const ledger = await runQuery<MortalityLog>("mortality/list-ledger-by-batch.sql", [batchId]);
  if (ledger.length > 0) return ledger;
  return runQuery<MortalityLog>("mortality/list-by-batch.sql", [batchId]);
}

export async function listAllMortality(): Promise<MortalityLog[]> {
  return runQuery<MortalityLog>("mortality/list-all.sql");
}

export async function getMortalityTotalByBatch(batchId: string): Promise<number> {
  const rows = await runQuery<{ total: number }>("mortality/total-by-batch.sql", [batchId]);
  return rows[0]?.total ?? 0;
}

export async function getBatchMetrics(batchId: string): Promise<BatchMetricsRow | null> {
  const rows = await runQuery<BatchMetricsRow>("mortality/get-batch-metrics.sql", [batchId]);
  return rows[0] ?? null;
}
