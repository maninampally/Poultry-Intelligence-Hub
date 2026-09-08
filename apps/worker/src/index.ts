/**
 * @deprecated Use `apps/worker-python` (Celery) for all background work.
 * This TypeScript package is frozen and must not receive new job logic.
 */

export const workerStatus = 'deprecated — use apps/worker-python';

export interface WorkerJob {
  type: 'alert' | 'report' | 'sync';
  batchId?: string;
  scheduledAt: string;
}

export const enqueueWorkerJob = (_job: WorkerJob): never => {
  throw new Error(
    '@murgi-mitra/worker is frozen. Enqueue jobs through apps/worker-python (Celery).',
  );
};
