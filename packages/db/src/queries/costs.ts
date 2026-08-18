import { runQuery } from "../sqlLoader";

export interface CostEntry {
  id: string;
  batchId: string;
  category: string;
  subCategory: string;
  amount: number;
  quantity: number | null;
  unit: string | null;
  date: Date;
  note: string | null;
  createdAt: Date;
}

export async function insertCost(entry: {
  batchId: string;
  category: string;
  subCategory: string;
  amount: number;
  quantity?: number | null;
  unit?: string | null;
  date: Date;
  note?: string | null;
}): Promise<CostEntry> {
  const rows = await runQuery<CostEntry>("costs/insert-cost.sql", [
    entry.batchId,
    entry.category,
    entry.subCategory,
    entry.amount,
    entry.quantity ?? null,
    entry.unit ?? null,
    entry.date,
    entry.note ?? null,
  ]);
  return rows[0];
}

export async function listCostsByBatch(batchId: string): Promise<CostEntry[]> {
  return runQuery<CostEntry>("costs/list-by-batch.sql", [batchId]);
}

export async function listAllCosts(): Promise<CostEntry[]> {
  return runQuery<CostEntry>("costs/list-all.sql");
}

export async function getCostTotalByBatch(batchId: string): Promise<number> {
  const rows = await runQuery<{ total: number }>("costs/total-by-batch.sql", [batchId]);
  return rows[0]?.total ?? 0;
}
