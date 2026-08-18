import type { Batch } from './batch.types';

export class BatchService {
  static list(): Batch[] {
    return [
      {
        id: 'batch-1',
        farmId: 'farm-1',
        batchCode: 'BR-101',
        status: 'active',
        placementCount: 1200,
        startedAt: new Date().toISOString(),
      },
      {
        id: 'batch-2',
        farmId: 'farm-2',
        batchCode: 'BR-202',
        status: 'active',
        placementCount: 970,
        startedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}
