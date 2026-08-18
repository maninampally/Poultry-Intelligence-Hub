import { runQuery } from "../sqlLoader";

export interface Batch {
  id: string;
  batchCode: string;
  farmId: string;
  shedId: string;
  startDate: Date;
  targetSaleDate: Date | null;
  placementCount: number;
  chickSupplier: string;
  breed: string;
  contractType: string;
  status: "draft" | "active" | "harvesting" | "closed";
  notes: string | null;
  createdAt: Date;
}

export async function insertBatch(batch: {
  batchCode: string;
  farmId: string;
  shedId: string;
  startDate: Date;
  targetSaleDate?: Date | null;
  placementCount: number;
  chickSupplier: string;
  breed: string;
  contractType: string;
  status?: string;
  notes?: string | null;
}): Promise<Batch> {
  const rows = await runQuery<Batch>("batches/insert-batch.sql", [
    batch.batchCode,
    batch.farmId,
    batch.shedId,
    batch.startDate,
    batch.targetSaleDate ?? null,
    batch.placementCount,
    batch.chickSupplier,
    batch.breed,
    batch.contractType,
    batch.status ?? "active",
    batch.notes ?? null,
  ]);
  return rows[0];
}

export async function getBatchById(batchId: string): Promise<Batch | null> {
  const rows = await runQuery<Batch>("batches/get-batch-by-id.sql", [batchId]);
  return rows[0] ?? null;
}

export async function listBatches(filter: {
  status?: string;
  farmId?: string;
} = {}): Promise<Batch[]> {
  if (filter.status && filter.farmId) {
    return runQuery<Batch>("batches/list-batches-by-status-and-farm.sql", [
      filter.status,
      filter.farmId,
    ]);
  }
  if (filter.status) {
    return runQuery<Batch>("batches/list-batches-by-status.sql", [filter.status]);
  }
  if (filter.farmId) {
    return runQuery<Batch>("batches/list-batches-by-farm.sql", [filter.farmId]);
  }
  return runQuery<Batch>("batches/list-batches.sql");
}

export async function updateBatchStatus(
  batchId: string,
  status: Batch["status"],
): Promise<Batch | null> {
  const rows = await runQuery<Batch>("batches/update-batch-status.sql", [
    batchId,
    status,
  ]);
  return rows[0] ?? null;
}
