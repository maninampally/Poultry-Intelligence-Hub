export interface LocalFarm {
  id: string;
  name: string;
  location: string;
}

export interface LocalBatch {
  id: string;
  farmId: string;
  batchCode: string;
  status: 'draft' | 'active' | 'harvesting' | 'closed';
  placementCount: number;
  startedAt: string;
}

export interface LocalMortalityEntry {
  id: string;
  batchId: string;
  shedId: string;
  count: number;
  cause: 'respiratory' | 'heat' | 'ascites' | 'unknown' | 'other';
  occurredAt: string;
}

export interface LocalDbState {
  farms: LocalFarm[];
  batches: LocalBatch[];
  mortality: LocalMortalityEntry[];
}

export const localDb: LocalDbState = {
  farms: [
    { id: 'farm-1', name: 'Green Valley Poultry', location: 'Chennai' },
    { id: 'farm-2', name: 'Coastal Layers', location: 'Vellore' },
  ],
  batches: [
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
  ],
  mortality: [],
};

export const listFarms = (): LocalFarm[] => localDb.farms;
export const listBatches = (): LocalBatch[] => localDb.batches;
export const listMortality = (): LocalMortalityEntry[] => localDb.mortality;

export const addMortalityEntry = (entry: LocalMortalityEntry): LocalMortalityEntry => {
  localDb.mortality = [entry, ...localDb.mortality];
  return entry;
};
