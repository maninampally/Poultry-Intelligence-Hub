INSERT INTO feed_logs (batch_id, shed_id, date, shift, feed_type, feed_brand, bag_number, kg_given, kg_returned)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING
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
