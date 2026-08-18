export type SyncStatus = 'pending' | 'synced' | 'rejected';

export interface LocalTableDefinition {
  name: string;
  fields: Record<string, string>;
}

export const schema: LocalTableDefinition[] = [
  {
    name: 'mortality_events',
    fields: {
      id: 'string',
      batch_id: 'string',
      shed_id: 'string',
      count: 'number',
      cause: 'string',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'feed_usage_events',
    fields: {
      id: 'string',
      batch_id: 'string',
      kg_given: 'number',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'weight_samples',
    fields: {
      id: 'string',
      batch_id: 'string',
      average_weight: 'number',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'expense_entries',
    fields: {
      id: 'string',
      batch_id: 'string',
      amount: 'number',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'sale_records',
    fields: {
      id: 'string',
      batch_id: 'string',
      amount: 'number',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'health_events',
    fields: {
      id: 'string',
      batch_id: 'string',
      type: 'string',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'vaccine_events',
    fields: {
      id: 'string',
      batch_id: 'string',
      vaccine_name: 'string',
      occurred_at: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'organizations',
    fields: {
      id: 'string',
      name: 'string',
      sync_status: 'string',
    },
  },
  {
    name: 'farms',
    fields: {
      id: 'string',
      name: 'string',
      sync_status: 'string',
    },
  },
  {
    name: 'sheds',
    fields: {
      id: 'string',
      farm_id: 'string',
      name: 'string',
      sync_status: 'string',
    },
  },
  {
    name: 'batches',
    fields: {
      id: 'string',
      farm_id: 'string',
      batch_code: 'string',
      status: 'string',
      sync_status: 'string',
    },
  },
  {
    name: 'batch_metrics',
    fields: {
      id: 'string',
      batch_id: 'string',
      mortality_percent: 'number',
      fcr: 'number',
      sync_status: 'string',
    },
  },
  {
    name: 'sync_outbox',
    fields: {
      id: 'string',
      resource: 'string',
      action: 'string',
      entity_id: 'string',
      payload: 'string',
      sync_status: 'string',
    },
  },
  {
    name: 'sync_rejections',
    fields: {
      id: 'string',
      resource: 'string',
      reason: 'string',
      occurred_at: 'number',
    },
  },
  {
    name: 'device_session',
    fields: {
      id: 'string',
      token: 'string',
      expires_at: 'number',
    },
  },
];
