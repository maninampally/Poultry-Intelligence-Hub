/** Typed domain models for Poultry Intelligence (mirrors the documented data model). */

export type FlockStatus =
  | "planned"
  | "active"
  | "ready"
  | "partially_lifted"
  | "completed"
  | "archived";

export type HealthStatus = "healthy" | "attention" | "critical";

export interface Farm {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  ownerRole: string;
  totalSheds: number;
  totalCapacity: number;
}

export interface Flock {
  id: string;
  name: string; // e.g. "Flock 01"
  breed: string; // "Broilers"
  status: FlockStatus;
  health: HealthStatus;
  placedDate: string; // ISO
  expectedMarketDate: string; // ISO
  initialBirds: number;
  currentBirds: number;
  ageDays: number;
  cycleLengthDays: number;
  metrics: FlockMetrics;
}

export interface FlockMetrics {
  mortalityCount: number;
  mortalityPct: number;
  avgWeightKg: number;
  weightGainKgPerDay: number;
  fcr: number;
  livabilityPct: number;
  costPerBird: number;
  feedTodayKg: number;
  waterTodayL: number;
}

export interface DailyRecordEntry {
  date: string; // ISO
  feedKg: number;
  feedExpectedKg: number;
  waterL: number;
  waterExpectedL: number;
  mortality: number;
  mortalityExpectedRange: [number, number];
  avgWeightKg: number;
  avgWeightExpectedKg: number;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  kind: "feed" | "water" | "mortality" | "weight" | "medicine" | "vaccination";
  label: string;
  value: string;
  timestamp: string; // display string e.g. "Today, 08:20"
}

export interface Medication {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  status: "ongoing" | "completed";
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  status: "upcoming" | "done";
}

export interface FinanceRow {
  label: string;
  current: string;
  previous: string;
  highlight?: boolean;
}

export interface BatchSummary {
  id: string;
  name: string;
  ageDays: number;
  birds: number;
  status: FlockStatus;
  health: HealthStatus;
  dateRange: string; // "Oct 15 2025 - Nov 26 2025"
  fcr?: number;
  profit?: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Optional grounded metric rows shown under an assistant answer. */
  facts?: { label: string; value: string }[];
}

export interface SeriesPoint {
  label: string;
  value: number;
}
