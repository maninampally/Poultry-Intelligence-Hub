export type LanguageCode = 'en' | 'hi' | 'ta' | 'te';

export interface FarmerUser {
  id: string;
  name: string;
  phone: string;
  language: LanguageCode;
}

export interface BatchSummary {
  batchId: string;
  farmId: string;
  status: 'draft' | 'active' | 'harvesting' | 'closed';
  mortalityPercent: number;
  fcr: number;
}
