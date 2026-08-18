export type MortalityCause = 'respiratory' | 'heat' | 'ascites' | 'unknown' | 'other';

export interface MortalityEntry {
  id: string;
  batchId: string;
  shedId: string;
  count: number;
  cause: MortalityCause;
  occurredAt: string;
}
