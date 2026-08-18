import { runQuery } from "../sqlLoader";

export interface BatchWithShedAndFarm {
  batchId: string;
  batchCode: string;
  farmId: string;
  shedId: string;
  startDate: Date;
  targetSaleDate: Date | null;
  placementCount: number;
  chickSupplier: string;
  breed: string;
  contractType: string;
  status: string;
  notes: string | null;
  batchCreatedAt: Date;
  shedName: string;
  shedCapacity: number;
  shedAreaSqft: number;
  farmName: string;
  farmState: string;
  farmDistrict: string;
}

export async function getBatchWithShedAndFarm(
  batchId: string,
): Promise<BatchWithShedAndFarm | null> {
  const rows = await runQuery<BatchWithShedAndFarm>(
    "shared/get-batch-with-shed-and-farm.sql",
    [batchId],
  );
  return rows[0] ?? null;
}
