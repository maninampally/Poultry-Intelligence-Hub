SELECT
  COALESCE(SUM(kg_given), 0) AS "given",
  COALESCE(SUM(kg_returned), 0) AS "returned"
FROM feed_logs
WHERE batch_id = $1
