import {
  ActivityItem,
  AiMessage,
  BatchSummary,
  DailyRecordEntry,
  Farm,
  FinanceRow,
  Flock,
  Medication,
  SeriesPoint,
  Vaccination,
} from "./models";

/** All values below are taken directly from the product mockups (Mockup B). */

export const demoFarm: Farm = {
  id: "farm-1",
  name: "Sri Venkateshwara Poultry Farm",
  location: "Tamil Nadu, India",
  ownerName: "Ravi Kumar",
  ownerRole: "Owner",
  totalSheds: 2,
  totalCapacity: 10000,
};

export const activeFlock: Flock = {
  id: "flock-01",
  name: "Flock 01",
  breed: "Broilers",
  status: "active",
  health: "healthy",
  placedDate: "2025-09-02",
  expectedMarketDate: "2025-12-10",
  initialBirds: 5000,
  currentBirds: 4820,
  ageDays: 24,
  cycleLengthDays: 30, // ~80% completed at day 24
  metrics: {
    mortalityCount: 180,
    mortalityPct: 3.6,
    avgWeightKg: 2.18,
    weightGainKgPerDay: 1.05,
    fcr: 1.62,
    livabilityPct: 96.4,
    costPerBird: 17.51,
    feedTodayKg: 1240,
    waterTodayL: 3420,
  },
};

export const todayRecord: DailyRecordEntry = {
  date: "2025-09-26",
  feedKg: 1240,
  feedExpectedKg: 1180,
  waterL: 3420,
  waterExpectedL: 3350,
  mortality: 12,
  mortalityExpectedRange: [10, 15],
  avgWeightKg: 2.18,
  avgWeightExpectedKg: 2.1,
};

export const recentActivity: ActivityItem[] = [
  { id: "a1", kind: "feed", label: "Feed given", value: "1,240 kg", timestamp: "Today, 08:20" },
  { id: "a2", kind: "water", label: "Water consumed", value: "3,420 L", timestamp: "Today, 08:15" },
  { id: "a3", kind: "mortality", label: "Mortality", value: "12 birds", timestamp: "Today, 07:45" },
];

// Weight trend (kg) across the cycle — matches the rising curve in the mockups.
export const weightTrend: SeriesPoint[] = [
  { label: "Day 1", value: 1.0 },
  { label: "7", value: 1.2 },
  { label: "14", value: 1.6 },
  { label: "21", value: 2.1 },
  { label: "24", value: 2.18 },
];

// Target weight curve for "Weight vs Target".
export const weightTarget: SeriesPoint[] = [
  { label: "Day 1", value: 1.05 },
  { label: "7", value: 1.3 },
  { label: "14", value: 1.65 },
  { label: "21", value: 2.0 },
  { label: "24", value: 2.12 },
];

// FCR trend — dips over time toward the current 1.62.
export const fcrTrend: SeriesPoint[] = [
  { label: "W1", value: 1.82 },
  { label: "W2", value: 1.74 },
  { label: "W3", value: 1.68 },
  { label: "W4", value: 1.64 },
  { label: "Now", value: 1.62 },
];

// Feed consumption per day (kg) Sep 20-26.
export const feedConsumption: SeriesPoint[] = [
  { label: "20", value: 980 },
  { label: "21", value: 1020 },
  { label: "22", value: 1080 },
  { label: "23", value: 1120 },
  { label: "24", value: 1160 },
  { label: "25", value: 1200 },
  { label: "26", value: 1240 },
];

// Water consumption per day (L).
export const waterConsumption: SeriesPoint[] = [
  { label: "20", value: 2800 },
  { label: "21", value: 2950 },
  { label: "22", value: 3100 },
  { label: "23", value: 3200 },
  { label: "24", value: 3280 },
  { label: "25", value: 3350 },
  { label: "26", value: 3420 },
];

export const medications: Medication[] = [
  {
    id: "m1",
    name: "Amoxicillin",
    startDate: "Sep 20",
    endDate: "Sep 27",
    currentDay: 6,
    totalDays: 7,
    status: "ongoing",
  },
  {
    id: "m2",
    name: "Vitamin C",
    startDate: "Sep 15",
    endDate: "Sep 22",
    currentDay: 3,
    totalDays: 7,
    status: "ongoing",
  },
];

export const vaccinations: Vaccination[] = [
  { id: "v1", name: "Newcastle Disease", date: "Oct 5, 2025", status: "upcoming" },
  { id: "v2", name: "Gumboro", date: "Oct 12, 2025", status: "upcoming" },
];

// Finance: Flock 07 (current) vs Flock 06 (previous).
export const financeComparison: FinanceRow[] = [
  { label: "Birds sold", current: "4,820", previous: "4,610" },
  { label: "Revenue", current: "₹4,25,000", previous: "₹4,02,000" },
  { label: "Feed Cost", current: "₹2,10,000", previous: "₹2,04,000" },
  { label: "Medicine", current: "₹18,000", previous: "₹16,000" },
  { label: "Other Cost", current: "₹32,000", previous: "₹30,000" },
  { label: "Total Cost", current: "₹2,60,000", previous: "₹2,50,000" },
  { label: "Profit", current: "₹82,400", previous: "₹76,200", highlight: true },
  { label: "Profit / Bird", current: "₹17.10", previous: "₹16.52" },
  { label: "FCR", current: "1.62", previous: "1.67" },
];

export const historicalBatches: BatchSummary[] = [
  {
    id: "flock-07",
    name: "Flock 07",
    ageDays: 42,
    birds: 4820,
    status: "completed",
    health: "healthy",
    dateRange: "Oct 15, 2025 - Nov 26, 2025",
    fcr: 1.62,
    profit: "₹82,400",
  },
  {
    id: "flock-06",
    name: "Flock 06",
    ageDays: 41,
    birds: 4610,
    status: "completed",
    health: "healthy",
    dateRange: "Sep 10, 2025 - Oct 21, 2025",
    fcr: 1.67,
    profit: "₹76,200",
  },
  {
    id: "flock-05",
    name: "Flock 05",
    ageDays: 40,
    birds: 4500,
    status: "completed",
    health: "healthy",
    dateRange: "Jul 02, 2025 - Aug 11, 2025",
    fcr: 1.71,
    profit: "₹68,900",
  },
];

export const plannedFlocks: BatchSummary[] = [
  {
    id: "flock-01-plan",
    name: "Flock 01",
    ageDays: 24,
    birds: 4820,
    status: "active",
    health: "healthy",
    dateRange: "Oct 15, 2025 (Market)",
  },
  {
    id: "flock-02-plan",
    name: "Flock 02",
    ageDays: 12,
    birds: 4600,
    status: "active",
    health: "healthy",
    dateRange: "Oct 28, 2025 (Market)",
  },
];

export const aiConversation: AiMessage[] = [
  {
    id: "u1",
    role: "user",
    text: "How is my current batch performing compared to last 5 batches?",
  },
  {
    id: "a1",
    role: "assistant",
    text: "Your current Flock 07 is performing better than your previous 5 batches in feed efficiency.",
    facts: [
      { label: "Current FCR", value: "1.62" },
      { label: "Previous 5-batch average", value: "1.68" },
    ],
  },
];

export const aiSuggestions = [
  "Which batch made the most profit?",
  "Why was Flock 05 profitable?",
];
