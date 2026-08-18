export const workerStatus = 'Murgi Mitra worker scaffold';

export interface WorkerJob {
  type: 'alert' | 'report' | 'sync';
  batchId?: string;
  scheduledAt: string;
}

export const enqueueWorkerJob = (job: WorkerJob): WorkerJob => job;
