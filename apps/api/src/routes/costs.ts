import { Router, type IRouter } from "express";
import { getBatchById, insertCost, listCostsByBatch } from "@murgi-mitra/db";
import {
  ListCostsParams,
  ListCostsResponse,
  LogCostParams,
  LogCostBody,
  GetCostSummaryParams,
  GetCostSummaryResponse,
} from "@murgi-mitra/api-zod";
import { computeBatchAggregates, dayOfBatch } from "../lib/calc";

const router: IRouter = Router();

router.get("/batches/:batchId/costs", async (req, res): Promise<void> => {
  const params = ListCostsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const items = await listCostsByBatch(params.data.batchId);
  res.json(ListCostsResponse.parse(items.slice().reverse()));
});

router.post("/batches/:batchId/costs", async (req, res): Promise<void> => {
  const params = LogCostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LogCostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const entry = await insertCost({
    batchId: params.data.batchId,
    category: body.data.category,
    subCategory: body.data.subCategory,
    amount: body.data.amount,
    quantity: body.data.quantity ?? null,
    unit: body.data.unit ?? null,
    date: new Date(body.data.date),
    note: body.data.note ?? null,
  });
  res.status(201).json(entry);
});

router.get("/batches/:batchId/costs/summary", async (req, res): Promise<void> => {
  const params = GetCostSummaryParams.safeParse(req.params);
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
  const items = await listCostsByBatch(batch.id);
  const totalCost = items.reduce((s, c) => s + c.amount, 0);
  const byCategory = new Map<string, number>();
  for (const c of items) byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.amount);
  const breakdown = Array.from(byCategory.entries()).map(([category, amount]) => ({
    category,
    amount,
    pctOfTotal: totalCost > 0 ? (amount / totalCost) * 100 : 0,
  }));

  // Daily cumulative cost history
  const start = new Date(batch.startDate);
  const days = Math.max(1, agg.dayOfBatch);
  const history: { date: Date; value: number }[] = [];
  let cum = 0;
  for (let d = 0; d <= days; d++) {
    const dt = new Date(start);
    dt.setDate(dt.getDate() + d);
    dt.setHours(0, 0, 0, 0);
    const next = new Date(dt);
    next.setDate(next.getDate() + 1);
    const todayAdds = items
      .filter((c) => {
        const cd = new Date(c.date);
        return cd >= dt && cd < next;
      })
      .reduce((s, c) => s + c.amount, 0);
    cum += todayAdds;
    history.push({ date: dt, value: Number(cum.toFixed(2)) });
  }

  const dailyRate = days > 0 ? totalCost / days : 0;
  const projectedTotalCost = totalCost + dailyRate * Math.max(0, 42 - days);
  const projectedCostPerBird = agg.currentFlock > 0 ? projectedTotalCost / agg.currentFlock : 0;
  const breakEvenPricePerKg = agg.currentFlock > 0 ? projectedTotalCost / (agg.currentFlock * Math.max(agg.avgWeightKg, 2.0)) : 0;

  res.json(
    GetCostSummaryResponse.parse({
      totalCost: Number(totalCost.toFixed(2)),
      costPerBirdToday: Number(agg.costPerBird.toFixed(2)),
      projectedTotalCost: Number(projectedTotalCost.toFixed(2)),
      projectedCostPerBird: Number(projectedCostPerBird.toFixed(2)),
      breakEvenPricePerKg: Number(breakEvenPricePerKg.toFixed(2)),
      breakdown,
      history,
    }),
  );
});

void dayOfBatch;
export default router;
