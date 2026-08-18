export interface BatchStoreState {
  selectedBatchId: string | null;
}

const batchStore: BatchStoreState = {
  selectedBatchId: null,
};

export const useBatchStore = () => batchStore;
