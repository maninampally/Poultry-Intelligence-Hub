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
ORDER BY created_at ASC
