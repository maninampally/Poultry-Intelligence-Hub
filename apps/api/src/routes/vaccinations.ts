import { Router, type IRouter } from "express";
import {
  getBatchById,
  insertVaccination,
  listVaccinationsByBatch,
} from "@murgi-mitra/db";
import {
  ListVaccinationsParams,
  ListVaccinationsResponse,
  LogVaccinationParams,
  LogVaccinationBody,
  GetVaccinationScheduleParams,
  GetVaccinationScheduleResponse,
} from "@murgi-mitra/api-zod";
import { BROILER_VACCINE_SCHEDULE } from "../lib/vaccineSchedule";

const router: IRouter = Router();

router.get("/batches/:batchId/vaccinations", async (req, res): Promise<void> => {
  const params = ListVaccinationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const items = await listVaccinationsByBatch(params.data.batchId);
  res.json(ListVaccinationsResponse.parse(items));
});

router.post("/batches/:batchId/vaccinations", async (req, res): Promise<void> => {
  const params = LogVaccinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LogVaccinationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const log = await insertVaccination({
    batchId: params.data.batchId,
    vaccineName: body.data.vaccineName,
    doseDate: new Date(body.data.doseDate),
    doseNumber: body.data.doseNumber,
    cost: body.data.cost ?? null,
    batchNo: body.data.batchNo ?? null,
    route: body.data.route ?? null,
    administeredBy: body.data.administeredBy ?? null,
  });
  res.status(201).json(log);
});

router.get("/batches/:batchId/vaccinations/schedule", async (req, res): Promise<void> => {
  const params = GetVaccinationScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const completed = await listVaccinationsByBatch(batch.id);
  const completedNames = new Set(completed.map((c) => c.vaccineName));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(batch.startDate);
  start.setHours(0, 0, 0, 0);

  const schedule = BROILER_VACCINE_SCHEDULE.map((v) => {
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + v.dueDay);
    let status: "completed" | "due" | "upcoming" | "overdue";
    if (completedNames.has(v.vaccineName)) status = "completed";
    else {
      const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
      if (diffDays < -1) status = "overdue";
      else if (diffDays <= 1) status = "due";
      else status = "upcoming";
    }
    return {
      vaccineName: v.vaccineName,
      dueDay: v.dueDay,
      dueDate,
      status,
      route: v.route,
      notes: v.notes ?? null,
    };
  });
  res.json(GetVaccinationScheduleResponse.parse(schedule));
});

export default router;
