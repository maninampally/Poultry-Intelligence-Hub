SELECT
  id,
  batch_id AS "batchId",
  shed_id AS "shedId",
  date,
  shift,
  feed_type AS "feedType",
  feed_brand AS "feedBrand",
  bag_number AS "bagNumber",
  kg_given AS "kgGiven",
  kg_returned AS "kgReturned",
  created_at AS "createdAt"
FROM feed_logs
WHERE batch_id = $1
ORDER BY date DESC
