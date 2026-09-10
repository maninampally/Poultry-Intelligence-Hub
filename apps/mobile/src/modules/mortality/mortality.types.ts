export type MortalityCause = 'respiratory' | 'heat' | 'ascites' | 'unknown' | 'other';

export interface MortalityEntry {
  id: string;
  batchId: string;
  shedId: string;
  count: number;
  cause: MortalityCause;
  occurredAt: string;
  /** When set, this entry corrects/supersedes the referenced event (original is kept). */
  supersedesEventId?: string;
}
