export type BatchStatus = 'draft' | 'active' | 'harvesting' | 'closed';

export interface Farm {
  id: string;
  name: string;
  state: string;
  district: string;
}

export interface Shed {
  id: string;
  farmId: string;
  name: string;
  capacity: number;
}

export interface Batch {
  id: string;
  farmId: string;
  shedId: string;
  batchCode: string;
  status: BatchStatus;
  placementCount: number;
  startDate: string;
  expectedSaleDate?: string;
}

export interface MortalityEntry {
  id: string;
  batchId: string;
  shedId: string;
  date: string;
  count: number;
  cause: 'respiratory' | 'heat' | 'ascites' | 'unknown' | 'other';
}

export interface FeedEntry {
  id: string;
  batchId: string;
  shedId: string;
  date: string;
  kgGiven: number;
  kgReturned: number;
}
