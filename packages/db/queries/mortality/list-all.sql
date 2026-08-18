SELECT
  id,
  batch_id AS "batchId",
  shed_id AS "shedId",
  date,
  shift,
  count,
  cause,
  notes,
  photo_url AS "photoUrl",
  created_at AS "createdAt"
FROM mortality_logs
ORDER BY created_at ASC
