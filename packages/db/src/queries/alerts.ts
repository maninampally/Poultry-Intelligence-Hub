import { runQuery } from "../sqlLoader";

export interface AlertLog {
  id: string;
  batchId: string;
  alertType: string;
  severity: string;
  messageEn: string;
  messageHi: string;
  recommendation: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export async function insertAlert(alert: {
  batchId: string;
  alertType: string;
  severity: string;
  messageEn: string;
  messageHi: string;
  recommendation?: string | null;
  createdAt?: Date | null;
}): Promise<AlertLog> {
  const rows = await runQuery<AlertLog>("alerts/insert-alert.sql", [
    alert.batchId,
    alert.alertType,
    alert.severity,
    alert.messageEn,
    alert.messageHi,
    alert.recommendation ?? null,
    alert.createdAt ?? null,
  ]);
  return rows[0];
}

export async function listAllAlerts(): Promise<AlertLog[]> {
  return runQuery<AlertLog>("alerts/list-all.sql");
}

export async function listAlertsByBatch(batchId: string): Promise<AlertLog[]> {
  return runQuery<AlertLog>("alerts/list-by-batch.sql", [batchId]);
}

export async function resolveAlert(alertId: string): Promise<AlertLog | null> {
  const rows = await runQuery<AlertLog>("alerts/resolve-alert.sql", [alertId]);
  return rows[0] ?? null;
}
