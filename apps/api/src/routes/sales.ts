import { Router, type IRouter } from "express";
import { getBatchById, insertSale, listSalesByBatch, type SaleRecord } from "@murgi-mitra/db";
import {
  ListSalesParams,
  ListSalesResponse,
  LogSaleParams,
  LogSaleBody,
} from "@murgi-mitra/api-zod";

const router: IRouter = Router();

function withRevenue(s: SaleRecord) {
  return { ...s, revenue: Number((s.totalWeightKg * s.pricePerKg).toFixed(2)) };
}

router.get("/batches/:batchId/sales", async (req, res): Promise<void> => {
  const params = ListSalesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const items = await listSalesByBatch(params.data.batchId);
  res.json(ListSalesResponse.parse(items.map(withRevenue)));
});

router.post("/batches/:batchId/sales", async (req, res): Promise<void> => {
  const params = LogSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LogSaleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const sale = await insertSale({
    batchId: params.data.batchId,
    saleDate: new Date(body.data.saleDate),
    birdsSold: body.data.birdsSold,
    totalWeightKg: body.data.totalWeightKg,
    pricePerKg: body.data.pricePerKg,
    buyer: body.data.buyer,
  });
  res.status(201).json(withRevenue(sale));
});

export default router;
