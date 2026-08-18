import { Router, type IRouter } from "express";
import {
  listFarms,
  listShedsByFarm,
  listBatches,
  listAllMortality,
  listAllFeed,
  listAllWeight,
  listAllCosts,
  listAllVaccinations,
  listAllSales,
  listAllAlerts,
} from "@murgi-mitra/db";
import {
  GetDashboardOverviewResponse,
  GetDashboardActivityResponse,
} from "@murgi-mitra/api-zod";
import { computeBatchAggregates } from "../lib/calc";

const router: IRouter = Router();

router.get("/dashboard/overview", async (_req, res): Promise<void> => {
  const farms = await listFarms();
  const shedsPerFarm = await Promise.all(farms.map((f) => listShedsByFarm(f.id)));
  const totalSheds = shedsPerFarm.reduce((s, sheds) => s + sheds.length, 0);
  const batches = await listBatches();
  const activeBatches = batches.filter((b) => b.status === "active" || b.status === "harvesting");

  const aggs = await Promise.all(activeBatches.map((b) => computeBatchAggregates(b.id, b)));

  const totalLiveBirds = aggs.reduce((s, a) => s + a.currentFlock, 0);
  const avgMortality = aggs.length > 0 ? aggs.reduce((s, a) => s + a.mortalityPct, 0) / aggs.length : 0;
  const fcrSamples = aggs.filter((a) => a.fcr > 0);
  const avgFcr = fcrSamples.length > 0 ? fcrSamples.reduce((s, a) => s + a.fcr, 0) / fcrSamples.length : 0;

  const projectedRevenue = aggs.reduce((s, a) => s + a.currentFlock * Math.max(a.avgWeightKg, 2.0) * 110, 0);

  const allAlerts = await listAllAlerts();
  const openAlertsRows = allAlerts.filter((a) => a.resolvedAt == null);

  const mortalityToday = aggs.reduce((s, a) => s + a.mortalityToday, 0);
  const feedConsumedToday = aggs.reduce((s, a) => s + a.feedTodayKg, 0);

  // KPI trend: total mortality % across past 14 days
  const allMort = await listAllMortality();
  const trend: { date: Date; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayDeaths = allMort
      .filter((m) => {
        const md = new Date(m.date);
        return md >= d && md < next;
      })
      .reduce((s, m) => s + m.count, 0);
    trend.push({ date: d, value: dayDeaths });
  }

  res.json(
    GetDashboardOverviewResponse.parse({
      totalFarms: farms.length,
      totalSheds,
      activeBatches: activeBatches.length,
      totalLiveBirds,
      avgMortalityPct: Number(avgMortality.toFixed(2)),
      avgFcr: Number(avgFcr.toFixed(2)),
      projectedRevenue: Number(projectedRevenue.toFixed(0)),
      openAlerts: openAlertsRows.length,
      mortalityToday,
      feedConsumedToday: Number(feedConsumedToday.toFixed(2)),
      kpiTrend: trend,
    }),
  );
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const farms = await listFarms();
  const farmMap = new Map(farms.map((f) => [f.id, f.name]));
  const batches = await listBatches();
  const batchMap = new Map(batches.map((b) => [b.id, b]));

  const limit = 20;
  const activities: {
    id: string;
    kind: string;
    batchCode: string;
    farmName: string;
    message: string;
    timestamp: Date;
    severity: string | null;
  }[] = [];

  const mort = await listAllMortality();
  for (const m of mort.slice(-15)) {
    const b = batchMap.get(m.batchId);
    if (!b) continue;
    activities.push({
      id: `m-${m.id}`,
      kind: "mortality",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: `${m.count} mortality logged (${m.cause.replace("_", " ")})`,
      timestamp: m.createdAt,
      severity: m.count >= 10 ? "warning" : "info",
    });
  }

  const feed = await listAllFeed();
  for (const f of feed.slice(-10)) {
    const b = batchMap.get(f.batchId);
    if (!b) continue;
    activities.push({
      id: `f-${f.id}`,
      kind: "feed",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: `${(f.kgGiven - f.kgReturned).toFixed(0)} kg ${f.feedType.replace("_", " ")} fed (${f.shift})`,
      timestamp: f.createdAt,
      severity: "info",
    });
  }

  const w = await listAllWeight();
  for (const x of w.slice(-5)) {
    const b = batchMap.get(x.batchId);
    if (!b) continue;
    activities.push({
      id: `w-${x.id}`,
      kind: "weight",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: `Weight sample: avg ${x.avgWeightKg.toFixed(2)} kg (${x.sampleSize} birds)`,
      timestamp: x.createdAt,
      severity: "info",
    });
  }

  const c = await listAllCosts();
  for (const x of c.slice(-5)) {
    const b = batchMap.get(x.batchId);
    if (!b) continue;
    activities.push({
      id: `c-${x.id}`,
      kind: "cost",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: `Cost added: ${x.subCategory} ₹${x.amount.toFixed(0)}`,
      timestamp: x.createdAt,
      severity: "info",
    });
  }

  const v = await listAllVaccinations();
  for (const x of v.slice(-5)) {
    const b = batchMap.get(x.batchId);
    if (!b) continue;
    activities.push({
      id: `v-${x.id}`,
      kind: "vaccination",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: `${x.vaccineName} administered (Dose ${x.doseNumber})`,
      timestamp: x.createdAt,
      severity: "info",
    });
  }

  const s = await listAllSales();
  for (const x of s.slice(-5)) {
    const b = batchMap.get(x.batchId);
    if (!b) continue;
    activities.push({
      id: `s-${x.id}`,
      kind: "sale",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: `Sale: ${x.birdsSold} birds @ ₹${x.pricePerKg}/kg to ${x.buyer}`,
      timestamp: x.createdAt,
      severity: "info",
    });
  }

  const alerts = await listAllAlerts();
  for (const x of alerts.slice(-10)) {
    const b = batchMap.get(x.batchId);
    if (!b) continue;
    activities.push({
      id: `a-${x.id}`,
      kind: "alert",
      batchCode: b.batchCode,
      farmName: farmMap.get(b.farmId) ?? "",
      message: x.messageEn,
      timestamp: x.createdAt,
      severity: x.severity,
    });
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  res.json(GetDashboardActivityResponse.parse(activities.slice(0, limit)));
});

export default router;
