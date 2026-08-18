import { Router, type IRouter } from "express";
import { getBatchById, insertWeight, listWeightByBatch } from "@murgi-mitra/db";
import {
  ListWeightParams,
  ListWeightResponse,
  LogWeightParams,
  LogWeightBody,
  GetGrowthCurveParams,
  GetGrowthCurveResponse,
} from "@murgi-mitra/api-zod";
import { dayOfBatch, standardWeightForDay } from "../lib/calc";

const router: IRouter = Router();

router.get("/batches/:batchId/weight", async (req, res): Promise<void> => {
  const params = ListWeightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const logs = await listWeightByBatch(params.data.batchId);
  res.json(ListWeightResponse.parse(logs.slice().reverse()));
});

router.post("/batches/:batchId/weight", async (req, res): Promise<void> => {
  const params = LogWeightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LogWeightBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const avg = body.data.totalWeightKg / Math.max(1, body.data.sampleSize);
  const log = await insertWeight({
    batchId: params.data.batchId,
    shedId: body.data.shedId,
    date: new Date(body.data.date),
    sampleSize: body.data.sampleSize,
    totalWeightKg: body.data.totalWeightKg,
    avgWeightKg: avg,
  });
  res.status(201).json(log);
});

router.get("/batches/:batchId/weight/curve", async (req, res): Promise<void> => {
  const params = GetGrowthCurveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const weights = await listWeightByBatch(batch.id);
  const today = dayOfBatch(batch.startDate);
  const curve: { day: number; actualWeight: number; standardWeight: number; deviationPct: number | null }[] = [];
  curve.push({ day: 0, actualWeight: 0.042, standardWeight: 0.042, deviationPct: 0 });
  for (const w of weights) {
    const d = dayOfBatch(batch.startDate, new Date(w.date));
    const std = standardWeightForDay(d);
    curve.push({
      day: d,
      actualWeight: w.avgWeightKg,
      standardWeight: std,
      deviationPct: std > 0 ? Number((((w.avgWeightKg - std) / std) * 100).toFixed(2)) : null,
    });
  }
  // project forward to today if last weight is older
  const last = curve[curve.length - 1];
  if (last && last.day < today) {
    const std = standardWeightForDay(today);
    const projected = last.actualWeight + ((std - last.standardWeight) * (last.actualWeight / Math.max(0.05, last.standardWeight)));
    curve.push({
      day: today,
      actualWeight: Number(projected.toFixed(3)),
      standardWeight: std,
      deviationPct: std > 0 ? Number((((projected - std) / std) * 100).toFixed(2)) : null,
    });
  }
  res.json(GetGrowthCurveResponse.parse(curve));
});

export default router;
