INSERT INTO mortality_logs (batch_id, shed_id, date, shift, count, cause, notes, photo_url)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING
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
