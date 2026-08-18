import { Router, type IRouter } from "express";
import {
  listBatches,
  insertBatch,
  getBatchById,
  updateBatchStatus,
  getShedById,
  getFarmById,
  listMortalityByBatch,
  listWeightByBatch,
  listCostsByBatch,
  insertCost,
  type Batch,
} from "@murgi-mitra/db";
import {
  ListBatchesQueryParams,
  ListBatchesResponse,
  CreateBatchBody,
  GetBatchParams,
  GetBatchResponse,
  UpdateBatchStatusParams,
  UpdateBatchStatusBody,
  GetBatchSummaryParams,
  GetBatchSummaryResponse,
} from "@murgi-mitra/api-zod";
import {
  computeBatchAggregates,
  dayOfBatch,
  standardWeightForDay,
  COBB_500_STANDARD,
} from "../lib/calc";

const router: IRouter = Router();

async function buildBatchListItem(b: Batch) {
  const shed = await getShedById(b.shedId);
  const farm = await getFarmById(b.farmId);
  const agg = await computeBatchAggregates(b.id, b);
  return {
    id: b.id,
    batchCode: b.batchCode,
    farmId: b.farmId,
    farmName: farm?.name ?? "",
    shedId: b.shedId,
    shedName: shed?.name ?? "",
    startDate: b.startDate,
    targetSaleDate: b.targetSaleDate,
    dayOfBatch: agg.dayOfBatch,
    placementCount: b.placementCount,
    currentFlock: agg.currentFlock,
    mortalityPct: Number(agg.mortalityPct.toFixed(2)),
    fcr: Number(agg.fcr.toFixed(2)),
    avgWeight: Number(agg.avgWeightKg.toFixed(3)),
    breed: b.breed,
    status: b.status,
    healthScore: agg.healthScore,
  };
}

router.get("/batches", async (req, res): Promise<void> => {
  const q = ListBatchesQueryParams.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: q.error.message });
    return;
  }
  const batches = await listBatches({ status: q.data.status, farmId: q.data.farmId });
  const items = await Promise.all(batches.map(buildBatchListItem));
  res.json(ListBatchesResponse.parse(items));
});

router.post("/batches", async (req, res): Promise<void> => {
  const parsed = CreateBatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const start = new Date(parsed.data.startDate);
  const monthStr = String(start.getMonth() + 1).padStart(2, "0");
  const yearStr = String(start.getFullYear()).slice(-2);
  const code = `B${yearStr}${monthStr}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const batch = await insertBatch({
    ...parsed.data,
    startDate: start,
    targetSaleDate: parsed.data.targetSaleDate ? new Date(parsed.data.targetSaleDate) : null,
    batchCode: code,
    status: "active",
  });

  // Auto-add chick cost as first cost entry
  await insertCost({
    batchId: batch.id,
    category: "chick",
    subCategory: "Day-old chicks",
    amount: parsed.data.placementCount * 38,
    quantity: parsed.data.placementCount,
    unit: "birds",
    date: start,
    note: "Auto: chick placement cost @ ₹38/bird",
  });

  res.status(201).json(GetBatchResponse.parse(batch));
});

router.get("/batches/:batchId", async (req, res): Promise<void> => {
  const params = GetBatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  res.json(GetBatchResponse.parse(batch));
});

router.patch("/batches/:batchId", async (req, res): Promise<void> => {
  const params = UpdateBatchStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateBatchStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await updateBatchStatus(params.data.batchId, body.data.status);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  res.json(batch);
});

router.get("/batches/:batchId/summary", async (req, res): Promise<void> => {
  const params = GetBatchSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const shed = await getShedById(batch.shedId);
  const farm = await getFarmById(batch.farmId);
  const agg = await computeBatchAggregates(batch.id, batch);

  // Mortality trend (last 7 days)
  const allMortality = await listMortalityByBatch(batch.id);
  const trend: { date: Date; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const total = allMortality
      .filter((m) => {
        const md = new Date(m.date);
        return md >= d && md < next;
      })
      .reduce((s, m) => s + m.count, 0);
    trend.push({ date: d, value: total });
  }

  // Growth curve
  const weights = await listWeightByBatch(batch.id);
  const curve: { day: number; actualWeight: number; standardWeight: number; deviationPct: number | null }[] = [];
  for (let day = 0; day <= Math.max(agg.dayOfBatch, 7); day += 7) {
    const matching = weights.find((w) => Math.abs(dayOfBatch(batch.startDate, new Date(w.date)) - day) <= 2);
    const std = standardWeightForDay(day);
    if (matching) {
      curve.push({
        day,
        actualWeight: matching.avgWeightKg,
        standardWeight: std,
        deviationPct: std > 0 ? ((matching.avgWeightKg - std) / std) * 100 : null,
      });
    } else if (day === 0) {
      curve.push({ day: 0, actualWeight: 0.042, standardWeight: 0.042, deviationPct: 0 });
    }
  }
  // Add a current data point if today is a partial week
  if (agg.dayOfBatch > 0 && curve[curve.length - 1]?.day !== agg.dayOfBatch) {
    const std = standardWeightForDay(agg.dayOfBatch);
    curve.push({
      day: agg.dayOfBatch,
      actualWeight: agg.avgWeightKg,
      standardWeight: std,
      deviationPct: std > 0 ? ((agg.avgWeightKg - std) / std) * 100 : null,
    });
  }

  // Cost breakdown
  const costs = await listCostsByBatch(batch.id);
  const byCategory = new Map<string, number>();
  for (const c of costs) {
    byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.amount);
  }
  const totalCost = agg.totalCost;
  const breakdown = Array.from(byCategory.entries()).map(([category, amount]) => ({
    category,
    amount,
    pctOfTotal: totalCost > 0 ? (amount / totalCost) * 100 : 0,
  }));

  // Projections
  const dailyCostRate = agg.dayOfBatch > 0 ? totalCost / agg.dayOfBatch : 0;
  const projectedTotalCost = totalCost + dailyCostRate * Math.max(0, 42 - agg.dayOfBatch);
  const projectedRevenue = agg.currentFlock * Math.max(agg.avgWeightKg, 2.0) * 110;
  const projectedMargin = projectedRevenue - projectedTotalCost;
  const breakEvenPricePerKg = agg.currentFlock > 0 ? projectedTotalCost / (agg.currentFlock * Math.max(agg.avgWeightKg, 2.0)) : 0;

  res.json(
    GetBatchSummaryResponse.parse({
      batch,
      farmName: farm?.name ?? "",
      shedName: shed?.name ?? "",
      dayOfBatch: agg.dayOfBatch,
      currentFlock: agg.currentFlock,
      mortalityPct: Number(agg.mortalityPct.toFixed(2)),
      mortalityToday: agg.mortalityToday,
      fcr: Number(agg.fcr.toFixed(2)),
      avgWeight: Number(agg.avgWeightKg.toFixed(3)),
      standardWeight: Number(agg.standardWeightKg.toFixed(3)),
      weightDeviationPct: Number(agg.weightDeviationPct.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      costPerBird: Number(agg.costPerBird.toFixed(2)),
      projectedMargin: Number(projectedMargin.toFixed(2)),
      breakEvenPricePerKg: Number(breakEvenPricePerKg.toFixed(2)),
      healthScore: agg.healthScore,
      feedConsumedTotal: Number(agg.feedConsumedKg.toFixed(2)),
      mortalityTrend: trend,
      growthCurve: curve,
      costBreakdown: breakdown,
    }),
  );
});

void COBB_500_STANDARD;

export default router;
