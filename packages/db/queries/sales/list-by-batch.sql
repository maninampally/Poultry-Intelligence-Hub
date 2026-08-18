SELECT
  id,
  batch_id AS "batchId",
  sale_date AS "saleDate",
  birds_sold AS "birdsSold",
  total_weight_kg AS "totalWeightKg",
  price_per_kg AS "pricePerKg",
  buyer,
  created_at AS "createdAt"
FROM sale_records
WHERE batch_id = $1
ORDER BY sale_date ASC
