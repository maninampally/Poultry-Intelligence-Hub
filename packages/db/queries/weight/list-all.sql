SELECT
  id,
  batch_id AS "batchId",
  shed_id AS "shedId",
  date,
  sample_size AS "sampleSize",
  total_weight_kg AS "totalWeightKg",
  avg_weight_kg AS "avgWeightKg",
  created_at AS "createdAt"
FROM weight_logs
ORDER BY created_at ASC
