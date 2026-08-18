export type ResourceName =
  | 'mortality-entry'
  | 'feed-usage'
  | 'weight-sample'
  | 'expense-entry'
  | 'sale-record'
  | 'health-event'
  | 'vaccine-event';

export interface ChangeRecord {
  id: string;
  resource: ResourceName;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface SyncPayload {
  changes: ChangeRecord[];
  cursor?: string;
}

export interface SyncResult {
  accepted: boolean;
  syncedCount: number;
  nextCursor?: string;
}
