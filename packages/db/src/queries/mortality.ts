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

export async function listMortalityByBatch(batchId: string): Promise<MortalityLog[]> {
  return runQuery<MortalityLog>("mortality/list-by-batch.sql", [batchId]);
}

export async function listAllMortality(): Promise<MortalityLog[]> {
  return runQuery<MortalityLog>("mortality/list-all.sql");
}

export async function getMortalityTotalByBatch(batchId: string): Promise<number> {
  const rows = await runQuery<{ total: number }>("mortality/total-by-batch.sql", [batchId]);
  return rows[0]?.total ?? 0;
}
