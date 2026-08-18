import { runQuery } from "../sqlLoader";

export interface WeightLog {
  id: string;
  batchId: string;
  shedId: string;
  date: Date;
  sampleSize: number;
  totalWeightKg: number;
  avgWeightKg: number;
  createdAt: Date;
}

export async function insertWeight(log: {
  batchId: string;
  shedId: string;
  date: Date;
  sampleSize: number;
  totalWeightKg: number;
  avgWeightKg: number;
}): Promise<WeightLog> {
  const rows = await runQuery<WeightLog>("weight/insert-weight.sql", [
    log.batchId,
    log.shedId,
    log.date,
    log.sampleSize,
    log.totalWeightKg,
    log.avgWeightKg,
  ]);
  return rows[0];
}

export async function listWeightByBatch(batchId: string): Promise<WeightLog[]> {
  return runQuery<WeightLog>("weight/list-by-batch.sql", [batchId]);
}

export async function listAllWeight(): Promise<WeightLog[]> {
  return runQuery<WeightLog>("weight/list-all.sql");
}
