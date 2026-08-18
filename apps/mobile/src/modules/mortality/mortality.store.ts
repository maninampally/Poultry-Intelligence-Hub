export interface MortalityDraft {
  batchId: string;
  shedId: string;
  count: number;
  cause: string;
}

export interface MortalityStoreState {
  draft: MortalityDraft;
  entries: Array<{
    id: string;
    batchId: string;
    shedId: string;
    count: number;
    cause: string;
    occurredAt: string;
  }>;
}

const emptyDraft: MortalityDraft = {
  batchId: '',
  shedId: '',
  count: 0,
  cause: 'unknown',
};

const mortalityStore: MortalityStoreState = {
  draft: emptyDraft,
  entries: [],
};

export const useMortalityStore = () => mortalityStore;

export const setMortalityDraft = (draft: Partial<MortalityDraft>) => {
  mortalityStore.draft = { ...mortalityStore.draft, ...draft };
};

export const resetMortalityDraft = () => {
  mortalityStore.draft = emptyDraft;
};

export const appendMortalityEntry = (entry: MortalityStoreState['entries'][number]) => {
  mortalityStore.entries = [entry, ...mortalityStore.entries];
};
