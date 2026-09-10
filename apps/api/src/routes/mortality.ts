import { Router, type IRouter } from "express";
import {
  listMortalityByBatch,
} from "@murgi-mitra/db";
import {
  ListMortalityParams,
  ListMortalityResponse,
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

/**
 * Farmer mortality writes are frozen on Express.
 * Mobile / farmer clients must push via FastAPI POST /v1/sync/push.
 * GET routes remain for the web dashboard during dual-stack.
 */
router.post("/batches/:batchId/mortality", (_req, res): void => {
  res.status(410).json({
    error:
      "Mortality writes via Express are frozen. Use FastAPI POST /v1/sync/push (mortality-entry).",
    code: "EXPRESS_MORTALITY_WRITE_FROZEN",
  });
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
