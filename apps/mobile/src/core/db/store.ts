import { loadJson, saveJson, storageKeys } from './persistedStore';

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
  supersedesEventId?: string;
}

export interface LocalDbState {
  farms: LocalFarm[];
  batches: LocalBatch[];
  mortality: LocalMortalityEntry[];
}

const seedFarms: LocalFarm[] = [
  { id: 'farm-1', name: 'Green Valley Poultry', location: 'Chennai' },
  { id: 'farm-2', name: 'Coastal Layers', location: 'Vellore' },
];

const seedBatches: LocalBatch[] = [
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

export const localDb: LocalDbState = {
  farms: seedFarms,
  batches: seedBatches,
  mortality: [],
};

let mortalityHydrated = false;
let mortalityHydratePromise: Promise<void> | null = null;

export async function hydrateLocalMortality(): Promise<void> {
  if (mortalityHydrated) return;
  if (!mortalityHydratePromise) {
    mortalityHydratePromise = (async () => {
      localDb.mortality = await loadJson<LocalMortalityEntry[]>(storageKeys.mortalityEvents, []);
      mortalityHydrated = true;
    })();
  }
  await mortalityHydratePromise;
}

async function persistMortality(): Promise<void> {
  await saveJson(storageKeys.mortalityEvents, localDb.mortality);
}

export const listFarms = (): LocalFarm[] => localDb.farms;
export const listBatches = (): LocalBatch[] => localDb.batches;
export const listMortality = (): LocalMortalityEntry[] => localDb.mortality;

export const addMortalityEntry = (entry: LocalMortalityEntry): LocalMortalityEntry => {
  if (localDb.mortality.some((existing) => existing.id === entry.id)) return entry;
  localDb.mortality = [entry, ...localDb.mortality];
  void persistMortality();
  return entry;
};

/** Awaitable write used by sync/correction paths that must flush before restart. */
export const addMortalityEntryDurable = async (
  entry: LocalMortalityEntry,
): Promise<LocalMortalityEntry> => {
  await hydrateLocalMortality();
  if (localDb.mortality.some((existing) => existing.id === entry.id)) return entry;
  localDb.mortality = [entry, ...localDb.mortality];
  await persistMortality();
  return entry;
};
