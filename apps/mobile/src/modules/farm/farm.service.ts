import type { Farm } from './farm.types';

export class FarmService {
  static list(): Farm[] {
    return [
      { id: 'farm-1', name: 'Green Valley Poultry', location: 'Chennai' },
      { id: 'farm-2', name: 'Coastal Layers', location: 'Vellore' },
      { id: 'farm-3', name: 'Sundar Poultry', location: 'Madurai' },
    ];
  }
}
