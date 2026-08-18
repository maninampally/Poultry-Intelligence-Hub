import { Router, type IRouter } from "express";
import {
  getBatchById,
  insertMortality,
  listMortalityByBatch,
} from "@murgi-mitra/db";
import {
  ListMortalityParams,
  ListMortalityResponse,
  LogMortalityParams,
  LogMortalityBody,
  GetMortalityTrendParams,
  GetMortalityTrendResponse,
} from "@murgi-mitra/api-zod";

const router: IRouter = Router();

router.get("/batches/:batchId/mortality", async (req, res): Promise<void> => {
  const params = ListMortalityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const logs = await listMortalityByBatch(params.data.batchId);
  res.json(ListMortalityResponse.parse(logs));
});

router.post("/batches/:batchId/mortality", async (req, res): Promise<void> => {
  const params = LogMortalityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LogMortalityBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const log = await insertMortality({
    batchId: params.data.batchId,
    shedId: body.data.shedId,
    date: new Date(body.data.date),
    shift: body.data.shift,
    count: body.data.count,
    cause: body.data.cause,
    notes: body.data.notes ?? null,
  });
  res.status(201).json(log);
});

router.get("/batches/:batchId/mortality/trend", async (req, res): Promise<void> => {
  const params = GetMortalityTrendParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const logs = await listMortalityByBatch(params.data.batchId);
  const points: { date: Date; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const total = logs
      .filter((m) => {
        const md = new Date(m.date);
        return md >= d && md < next;
      })
      .reduce((s, m) => s + m.count, 0);
    points.push({ date: d, value: total });
  }
  res.json(GetMortalityTrendResponse.parse(points));
});

export default router;
