export interface FarmModelShape {
  id: string;
  name: string;
  location: string;
  syncStatus: 'pending' | 'synced';
}

export class FarmModel {
  static table = 'farms';

  static create(payload: Omit<FarmModelShape, 'syncStatus'>): FarmModelShape {
    return { ...payload, syncStatus: 'pending' };
  }
}
