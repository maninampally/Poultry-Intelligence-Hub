export type BatchStatus = 'draft' | 'active' | 'harvesting' | 'closed';

export interface Batch {
  id: string;
  farmId: string;
  batchCode: string;
  status: BatchStatus;
  placementCount: number;
  startedAt: string;
}
