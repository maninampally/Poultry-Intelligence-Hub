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
WHERE batch_id = $1
ORDER BY date DESC, shift DESC
