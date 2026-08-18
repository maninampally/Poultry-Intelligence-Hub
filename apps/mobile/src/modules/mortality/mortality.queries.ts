export const mortalityQueries = {
  byBatch: (batchId: string) => ({ batchId, resource: 'mortality-events' }),
  recent: (limit = 10) => ({ limit, resource: 'mortality-events' }),
};
