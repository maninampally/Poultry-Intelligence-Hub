import { Router, type IRouter } from "express";
import {
  resolveAlert,
  getBatchById,
  getFarmById,
  listAllAlerts,
  listAlertsByBatch,
} from "@murgi-mitra/db";
import {
  GetInsightsParams,
  GetInsightsResponse,
  ListAlertsResponse,
} from "@murgi-mitra/api-zod";
import { computeBatchAggregates } from "../lib/calc";

const router: IRouter = Router();

router.post("/alerts/:alertId/resolve", async (req, res): Promise<void> => {
  const alertId = req.params.alertId;
  const updated = await resolveAlert(alertId);
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  const b = await getBatchById(updated.batchId);
  const f = b ? await getFarmById(b.farmId) : undefined;
  res.json({
    id: updated.id,
    batchId: updated.batchId,
    batchCode: b?.batchCode ?? "",
    farmName: f?.name ?? "",
    alertType: updated.alertType,
    severity: updated.severity,
    messageEn: updated.messageEn,
    messageHi: updated.messageHi,
    recommendation: updated.recommendation,
    createdAt: updated.createdAt,
    resolvedAt: updated.resolvedAt,
  });
});

router.get("/alerts", async (_req, res): Promise<void> => {
  const items = await listAllAlerts();
  const enriched = await Promise.all(
    items.slice().reverse().map(async (a) => {
      const b = await getBatchById(a.batchId);
      const f = b ? await getFarmById(b.farmId) : undefined;
      return {
        id: a.id,
        batchId: a.batchId,
        batchCode: b?.batchCode ?? "",
        farmName: f?.name ?? "",
        alertType: a.alertType,
        severity: a.severity,
        messageEn: a.messageEn,
        messageHi: a.messageHi,
        recommendation: a.recommendation,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
      };
    }),
  );
  res.json(ListAlertsResponse.parse(enriched));
});

router.get("/batches/:batchId/insights", async (req, res): Promise<void> => {
  const params = GetInsightsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const batch = await getBatchById(params.data.batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  const farm = await getFarmById(batch.farmId);
  const agg = await computeBatchAggregates(batch.id, batch);
  const alerts = await listAlertsByBatch(batch.id);

  let tipEn = "Maintain current ventilation and feed schedule. Birds are tracking well against standard.";
  let tipHi = "वर्तमान वेंटिलेशन और फ़ीड शेड्यूल बनाए रखें। पक्षी मानक के अनुसार अच्छी प्रगति कर रहे हैं।";
  if (agg.weightDeviationPct < -5) {
    tipEn = `Weight is ${Math.abs(Math.round(agg.weightDeviationPct))}% below Cobb 500 standard. Increase feeder space and check water flow rate today.`;
    tipHi = `वज़न Cobb 500 मानक से ${Math.abs(Math.round(agg.weightDeviationPct))}% कम है। आज फ़ीडर की जगह बढ़ाएँ और पानी का प्रवाह जाँचें।`;
  } else if (agg.fcr > 1.85) {
    tipEn = `FCR of ${agg.fcr.toFixed(2)} is above target 1.75. Reduce feed wastage by lifting feeders to back height and weighing leftovers daily.`;
    tipHi = `FCR ${agg.fcr.toFixed(2)} लक्ष्य 1.75 से ज़्यादा है। फ़ीडर ऊँचा रखें और रोज़ बचा हुआ फ़ीड तौलें।`;
  } else if (agg.mortalityToday > Math.max(5, agg.currentFlock * 0.005)) {
    tipEn = `${agg.mortalityToday} deaths today is above the 0.5% threshold. Inspect birds for respiratory signs and call your vet.`;
    tipHi = `आज ${agg.mortalityToday} मौतें 0.5% सीमा से ऊपर हैं। पक्षियों की साँस की जाँच करें और वेट को बुलाएँ।`;
  }

  const benchmarks = [
    {
      metric: "Mortality %",
      yourValue: Number(agg.mortalityPct.toFixed(2)),
      regionalAverage: 3.2,
      percentile: agg.mortalityPct < 2 ? 85 : agg.mortalityPct < 3.5 ? 55 : 25,
      comparison: agg.mortalityPct < 2.5 ? "better" : agg.mortalityPct < 3.5 ? "average" : "worse",
    },
    {
      metric: "FCR",
      yourValue: Number(agg.fcr.toFixed(2)),
      regionalAverage: 1.78,
      percentile: agg.fcr < 1.7 ? 85 : agg.fcr < 1.85 ? 55 : 25,
      comparison: agg.fcr < 1.75 ? "better" : agg.fcr < 1.85 ? "average" : "worse",
    },
    {
      metric: "Avg Weight (kg)",
      yourValue: Number(agg.avgWeightKg.toFixed(2)),
      regionalAverage: Number((agg.standardWeightKg * 0.96).toFixed(2)),
      percentile: agg.weightDeviationPct > 0 ? 80 : agg.weightDeviationPct > -3 ? 55 : 25,
      comparison: agg.weightDeviationPct > -2 ? "better" : agg.weightDeviationPct > -5 ? "average" : "worse",
    },
  ];

  const projectedRevenue = agg.currentFlock * Math.max(agg.avgWeightKg, 2.0) * 110;
  const projectedNetMargin = projectedRevenue - (agg.totalCost + (agg.dayOfBatch > 0 ? (agg.totalCost / agg.dayOfBatch) * Math.max(0, 42 - agg.dayOfBatch) : 0));

  const harvestDate = new Date(batch.startDate);
  // adjust based on weight gain rate
  const targetDay = agg.weightDeviationPct < -5 ? 44 : agg.weightDeviationPct > 3 ? 38 : 42;
  harvestDate.setDate(harvestDate.getDate() + targetDay);

  const enrichedAlerts = alerts.map((a) => ({
    id: a.id,
    batchId: a.batchId,
    batchCode: batch.batchCode,
    farmName: farm?.name ?? "",
    alertType: a.alertType,
    severity: a.severity,
    messageEn: a.messageEn,
    messageHi: a.messageHi,
    recommendation: a.recommendation,
    createdAt: a.createdAt,
    resolvedAt: a.resolvedAt,
  }));

  res.json(
    GetInsightsResponse.parse({
      healthScore: agg.healthScore,
      tipOfTheDay: tipEn,
      tipOfTheDayHi: tipHi,
      alerts: enrichedAlerts,
      benchmarks,
      predictedHarvestDate: harvestDate,
      projectedNetMargin: Number(projectedNetMargin.toFixed(2)),
    }),
  );
});

export default router;
