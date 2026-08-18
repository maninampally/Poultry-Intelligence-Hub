import { Router, type IRouter } from "express";
import { getBatchById, insertFeed, listFeedByBatch } from "@murgi-mitra/db";
import {
  ListFeedParams,
  ListFeedResponse,
  LogFeedParams,
  LogFeedBody,
  GetFcrTrendParams,
  GetFcrTrendResponse,
} from "@murgi-mitra/api-zod";
import { computeBatchAggregates, dayOfBatch } from "../lib/calc";

const router: IRouter = Router();

router.get("/batches/:batchId/feed", async (req, res): Promise<void> => {
  const params = ListFeedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const logs = await listFeedByBatch(params.data.batchId);
  res.json(ListFeedResponse.parse(logs));
});

router.post("/batches/:batchId/feed", async (req, res): Promise<void> => {
  const params = LogFeedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LogFeedBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const log = await insertFeed({
    batchId: params.data.batchId,
    shedId: body.data.shedId,
    date: new Date(body.data.date),
    shift: body.data.shift,
    feedType: body.data.feedType,
    feedBrand: body.data.feedBrand ?? null,
    bagNumber: body.data.bagNumber ?? null,
    kgGiven: body.data.kgGiven,
    kgReturned: body.data.kgReturned,
  });
  res.status(201).json(log);
});

router.get("/batches/:batchId/feed/fcr", async (req, res): Promise<void> => {
  const params = GetFcrTrendParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const agg = await computeBatchAggregates(batch.id, batch);
  const feeds = await listFeedByBatch(batch.id);

  // Daily cumulative feed and (linear-interpolated) weight to compute daily FCR proxy
  const days = Math.max(agg.dayOfBatch, 1);
  const trend: { date: Date; value: number }[] = [];
  let cumFeed = 0;
  for (let day = 1; day <= days; day++) {
    const dayDate = new Date(batch.startDate);
    dayDate.setDate(dayDate.getDate() + day);
    dayDate.setHours(0, 0, 0, 0);
    const dayConsumed = feeds
      .filter((f) => dayOfBatch(batch.startDate, new Date(f.date)) === day - 1)
      .reduce((s, f) => s + (f.kgGiven - f.kgReturned), 0);
    cumFeed += dayConsumed;
    const ratio = day / days;
    const interpolatedWeight = Math.max(0.05, agg.avgWeightKg * ratio);
    const liveWeightGain = agg.currentFlock * Math.max(0, interpolatedWeight - 0.042);
    const fcr = liveWeightGain > 0 ? cumFeed / liveWeightGain : 0;
    trend.push({ date: dayDate, value: Number(fcr.toFixed(2)) });
  }

  res.json(
    GetFcrTrendResponse.parse({
      currentFcr: Number(agg.fcr.toFixed(2)),
      targetFcr: 1.75,
      totalFeedKg: Number(agg.feedConsumedKg.toFixed(2)),
      totalLiveWeightGainKg: Number((agg.currentFlock * Math.max(0, agg.avgWeightKg - 0.042)).toFixed(2)),
      dailyTrend: trend,
    }),
  );
});

export default router;
