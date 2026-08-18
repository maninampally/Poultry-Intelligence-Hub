INSERT INTO weight_logs (batch_id, shed_id, date, sample_size, total_weight_kg, avg_weight_kg)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
  id,
  batch_id AS "batchId",
  shed_id AS "shedId",
  date,
  sample_size AS "sampleSize",
  total_weight_kg AS "totalWeightKg",
  avg_weight_kg AS "avgWeightKg",
  created_at AS "createdAt"
