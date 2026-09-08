import { listBatches } from '../../core/db/store';
import type { Batch } from './batch.types';

export class BatchService {
  static list(): Batch[] {
    return listBatches();
  }
}
