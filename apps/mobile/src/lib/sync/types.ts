export type SyncConfig = {
  apiBaseUrl: string;
  accessToken: string;
  orgId: string;
  deviceId: string;
};

export type SyncQueueRow = {
  id: string;
  entity: string;
  entity_id: string;
  operation: string;
  payload: string;
  attempts: number;
};

export type PushResultItem = {
  idempotency_key: string;
  status: 'accepted' | 'duplicate' | 'failed';
  record_id?: string;
  error?: string;
};

export type PushResponse = {
  results: PushResultItem[];
  summary: {
    total: number;
    accepted: number;
    duplicates: number;
    failed: number;
  };
};

export type DrainResult = {
  pushed: number;
  accepted: number;
  duplicates: number;
  failed: number;
  errors: string[];
};
