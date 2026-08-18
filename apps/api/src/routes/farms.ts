import { Router, type IRouter } from "express";
import {
  listFarms,
  insertFarm,
  getFarmById,
  listShedsByFarm,
  insertShed,
  listBatches,
  type Farm,
} from "@murgi-mitra/db";
import {
  ListFarmsResponse,
  CreateFarmBody,
  GetFarmParams,
  GetFarmResponse,
  ListShedsParams,
  ListShedsResponse,
  CreateShedParams,
  CreateShedBody,
} from "@murgi-mitra/api-zod";
import { computeBatchAggregates } from "../lib/calc";

const router: IRouter = Router();

async function farmListItem(farm: Farm) {
  const sheds = await listShedsByFarm(farm.id);
  const batches = await listBatches({ farmId: farm.id });
  const activeBatches = batches.filter((b) => b.status === "active" || b.status === "harvesting").length;
  const totalCapacity = sheds.reduce((s, sh) => s + sh.capacity, 0);
  return {
    id: farm.id,
    name: farm.name,
    state: farm.state,
    district: farm.district,
    village: farm.village,
    ownerName: farm.ownerName,
    latitude: farm.latitude,
    longitude: farm.longitude,
    sheds: sheds.length,
    activeBatches,
    totalCapacity,
    createdAt: farm.createdAt,
  };
}

router.get("/farms", async (_req, res): Promise<void> => {
  const farms = await listFarms();
  const items = await Promise.all(farms.map(farmListItem));
  res.json(ListFarmsResponse.parse(items));
});

router.post("/farms", async (req, res): Promise<void> => {
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const farm = await insertFarm(parsed.data);
  const item = await farmListItem(farm);
  res.status(201).json(item);
});

router.get("/farms/:farmId", async (req, res): Promise<void> => {
  const params = GetFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const farm = await getFarmById(params.data.farmId);
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  const sheds = await listShedsByFarm(farm.id);
  const batches = await listBatches({ farmId: farm.id });
  const activeBatches = batches.filter((b) => b.status === "active" || b.status === "harvesting").length;
  const totalCapacity = sheds.reduce((s, sh) => s + sh.capacity, 0);

  const shedMap = new Map(sheds.map((s) => [s.id, s]));
  const batchList = await Promise.all(
    batches.map(async (b) => {
      const agg = await computeBatchAggregates(b.id, b);
      const shed = shedMap.get(b.shedId);
      return {
        id: b.id,
        batchCode: b.batchCode,
        farmId: b.farmId,
        farmName: farm.name,
        shedId: b.shedId,
        shedName: shed?.name ?? "Shed",
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
    }),
  );

  res.json(
    GetFarmResponse.parse({
      id: farm.id,
      name: farm.name,
      state: farm.state,
      district: farm.district,
      village: farm.village,
      ownerName: farm.ownerName,
      latitude: farm.latitude,
      longitude: farm.longitude,
      sheds: sheds.length,
      activeBatches,
      totalCapacity,
      createdAt: farm.createdAt,
      shedList: sheds,
      batchList,
    }),
  );
});

router.get("/farms/:farmId/sheds", async (req, res): Promise<void> => {
  const params = ListShedsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sheds = await listShedsByFarm(params.data.farmId);
  res.json(ListShedsResponse.parse(sheds));
});

router.post("/farms/:farmId/sheds", async (req, res): Promise<void> => {
  const params = CreateShedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateShedBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const shed = await insertShed({ ...body.data, farmId: params.data.farmId });
  res.status(201).json(shed);
});

export default router;
