export interface BatchModelShape {
  id: string;
  farmId: string;
  batchCode: string;
  status: string;
  placementCount: number;
  startedAt: number;
  syncStatus: 'pending' | 'synced';
}

export class BatchModel {
  static table = 'batches';

  static create(payload: Omit<BatchModelShape, 'syncStatus'>): BatchModelShape {
    return { ...payload, startedAt: payload.startedAt, syncStatus: 'pending' };
  }
}
