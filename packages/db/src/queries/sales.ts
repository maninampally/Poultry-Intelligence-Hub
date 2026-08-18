import { runQuery } from "../sqlLoader";

export interface SaleRecord {
  id: string;
  batchId: string;
  saleDate: Date;
  birdsSold: number;
  totalWeightKg: number;
  pricePerKg: number;
  buyer: string;
  createdAt: Date;
}

export async function insertSale(sale: {
  batchId: string;
  saleDate: Date;
  birdsSold: number;
  totalWeightKg: number;
  pricePerKg: number;
  buyer: string;
}): Promise<SaleRecord> {
  const rows = await runQuery<SaleRecord>("sales/insert-sale.sql", [
    sale.batchId,
    sale.saleDate,
    sale.birdsSold,
    sale.totalWeightKg,
    sale.pricePerKg,
    sale.buyer,
  ]);
  return rows[0];
}

export async function listSalesByBatch(batchId: string): Promise<SaleRecord[]> {
  return runQuery<SaleRecord>("sales/list-by-batch.sql", [batchId]);
}

export async function listAllSales(): Promise<SaleRecord[]> {
  return runQuery<SaleRecord>("sales/list-all.sql");
}
