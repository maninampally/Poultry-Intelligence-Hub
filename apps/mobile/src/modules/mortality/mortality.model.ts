export interface MortalityModelShape {
  id: string;
  batchId: string;
  shedId: string;
  count: number;
  cause: string;
  occurredAt: number;
  syncStatus: 'pending' | 'synced' | 'rejected';
}

export class MortalityModel {
  static table = 'mortality_events';

  static create(payload: Omit<MortalityModelShape, 'syncStatus'>): MortalityModelShape {
    return {
      ...payload,
      occurredAt: payload.occurredAt,
      syncStatus: 'pending',
    };
  }
}
