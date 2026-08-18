export interface VaccineDef {
  vaccineName: string;
  dueDay: number;
  route: string;
  notes?: string;
}

export const BROILER_VACCINE_SCHEDULE: VaccineDef[] = [
  { vaccineName: "Marek's Disease", dueDay: 1, route: "Subcutaneous", notes: "Hatchery dose" },
  { vaccineName: "Newcastle Disease (B1)", dueDay: 5, route: "Eye drop" },
  { vaccineName: "Infectious Bronchitis (IB)", dueDay: 7, route: "Drinking water" },
  { vaccineName: "Infectious Bursal Disease (IBD-1)", dueDay: 12, route: "Drinking water" },
  { vaccineName: "Infectious Bursal Disease (IBD-2)", dueDay: 18, route: "Drinking water" },
  { vaccineName: "Newcastle Disease (LaSota)", dueDay: 21, route: "Drinking water" },
  { vaccineName: "Infectious Bronchitis Booster", dueDay: 28, route: "Drinking water" },
];
