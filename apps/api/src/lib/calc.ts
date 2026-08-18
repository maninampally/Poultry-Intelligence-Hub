import {
  getMortalityTotalByBatch,
  listMortalityByBatch,
  getFeedTotalsByBatch,
  listFeedByBatch,
  listWeightByBatch,
  getCostTotalByBatch,
  listSalesByBatch,
  getBatchWithShedAndFarm,
} from "@murgi-mitra/db";

export const COBB_500_STANDARD: Record<number, number> = {
  0: 0.042,
  1: 0.057,
  2: 0.072,
  3: 0.089,
  4: 0.108,
  5: 0.13,
  6: 0.155,
  7: 0.184,
  8: 0.216,
  9: 0.252,
  10: 0.292,
  11: 0.337,
  12: 0.386,
  13: 0.44,
  14: 0.499,
  15: 0.563,
  16: 0.633,
  17: 0.708,
  18: 0.789,
  19: 0.876,
  20: 0.969,
  21: 1.068,
  22: 1.173,
  23: 1.284,
  24: 1.401,
  25: 1.524,
  26: 1.653,
  27: 1.788,
  28: 1.928,
  29: 2.073,
  30: 2.223,
  31: 2.378,
  32: 2.537,
  33: 2.7,
  34: 2.866,
  35: 3.035,
  36: 3.207,
  37: 3.381,
  38: 3.557,
  39: 3.734,
  40: 3.912,
  41: 4.091,
  42: 4.27,
};

export function standardWeightForDay(day: number): number {
  if (day <= 0) return COBB_500_STANDARD[0];
  if (day >= 42) return COBB_500_STANDARD[42];
  return COBB_500_STANDARD[day] ?? 0;
}

export function dayOfBatch(startDate: Date, refDate: Date = new Date()): number {
  const ms = refDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export interface BatchAggregates {
  dayOfBatch: number;
  currentFlock: number;
  mortalityTotal: number;
  mortalityToday: number;
  mortalityPct: number;
  feedConsumedKg: number;
  feedTodayKg: number;
  avgWeightKg: number;
  standardWeightKg: number;
  weightDeviationPct: number;
  fcr: number;
  totalCost: number;
  costPerBird: number;
  totalRevenue: number;
  birdsSold: number;
  healthScore: number;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function computeBatchAggregates(batchId: string, batch: { startDate: Date; placementCount: number }): Promise<BatchAggregates> {
  const day = dayOfBatch(batch.startDate);

  const mortalityTotal = await getMortalityTotalByBatch(batchId);

  const allMortality = await listMortalityByBatch(batchId);
  const mortalityToday = allMortality
    .filter((r) => isToday(new Date(r.date)))
    .reduce((s, r) => s + r.count, 0);

  const currentFlock = Math.max(0, batch.placementCount - mortalityTotal);
  const mortalityPct = batch.placementCount > 0 ? (mortalityTotal / batch.placementCount) * 100 : 0;

  const feedTotals = await getFeedTotalsByBatch(batchId);
  const feedConsumedKg = Math.max(0, Number(feedTotals.given) - Number(feedTotals.returned));

  const allFeed = await listFeedByBatch(batchId);
  const feedTodayKg = allFeed
    .filter((r) => isToday(new Date(r.date)))
    .reduce((s, r) => s + (r.kgGiven - r.kgReturned), 0);

  const weights = await listWeightByBatch(batchId);
  const latestWeight = weights[weights.length - 1];
  const avgWeightKg = latestWeight ? latestWeight.avgWeightKg : standardWeightForDay(day) * 0.95;
  const standardWeightKg = standardWeightForDay(day);
  const weightDeviationPct = standardWeightKg > 0 ? ((avgWeightKg - standardWeightKg) / standardWeightKg) * 100 : 0;

  const totalLiveWeightGain = currentFlock * Math.max(0, avgWeightKg - 0.042);
  const fcr = totalLiveWeightGain > 0 ? feedConsumedKg / totalLiveWeightGain : 0;

  const totalCost = await getCostTotalByBatch(batchId);
  const costPerBird = currentFlock > 0 ? totalCost / currentFlock : 0;

  const saleRows = await listSalesByBatch(batchId);
  const totalRevenue = saleRows.reduce((s, r) => s + r.totalWeightKg * r.pricePerKg, 0);
  const birdsSold = saleRows.reduce((s, r) => s + r.birdsSold, 0);

  let healthScore = 100;
  if (mortalityPct > 1) healthScore -= Math.min(30, (mortalityPct - 1) * 12);
  if (fcr > 1.8) healthScore -= Math.min(25, (fcr - 1.8) * 30);
  if (weightDeviationPct < -2) healthScore -= Math.min(25, Math.abs(weightDeviationPct + 2) * 3);
  healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

  return {
    dayOfBatch: day,
    currentFlock,
    mortalityTotal,
    mortalityToday,
    mortalityPct,
    feedConsumedKg,
    feedTodayKg,
    avgWeightKg,
    standardWeightKg,
    weightDeviationPct,
    fcr,
    totalCost,
    costPerBird,
    totalRevenue,
    birdsSold,
    healthScore,
  };
}

export async function getFarmShedBatch(batchId: string) {
  return getBatchWithShedAndFarm(batchId);
}
