import { runQuery } from "../sqlLoader";

export interface VaccinationLog {
  id: string;
  batchId: string;
  vaccineName: string;
  doseDate: Date;
  doseNumber: number;
  cost: number | null;
  batchNo: string | null;
  route: string | null;
  administeredBy: string | null;
  createdAt: Date;
}

export async function insertVaccination(log: {
  batchId: string;
  vaccineName: string;
  doseDate: Date;
  doseNumber: number;
  cost?: number | null;
  batchNo?: string | null;
  route?: string | null;
  administeredBy?: string | null;
}): Promise<VaccinationLog> {
  const rows = await runQuery<VaccinationLog>("vaccinations/insert-vaccination.sql", [
    log.batchId,
    log.vaccineName,
    log.doseDate,
    log.doseNumber,
    log.cost ?? null,
    log.batchNo ?? null,
    log.route ?? null,
    log.administeredBy ?? null,
  ]);
  return rows[0];
}

export async function listVaccinationsByBatch(batchId: string): Promise<VaccinationLog[]> {
  return runQuery<VaccinationLog>("vaccinations/list-by-batch.sql", [batchId]);
}

export async function listAllVaccinations(): Promise<VaccinationLog[]> {
  return runQuery<VaccinationLog>("vaccinations/list-all.sql");
}
