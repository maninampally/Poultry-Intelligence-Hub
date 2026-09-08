import { listFarms } from '../../core/db/store';
import type { Farm } from './farm.types';

export class FarmService {
  static list(): Farm[] {
    return listFarms();
  }
}
