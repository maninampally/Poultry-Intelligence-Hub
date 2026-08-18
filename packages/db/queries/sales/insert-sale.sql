INSERT INTO sale_records (batch_id, sale_date, birds_sold, total_weight_kg, price_per_kg, buyer)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
  id,
  batch_id AS "batchId",
  sale_date AS "saleDate",
  birds_sold AS "birdsSold",
  total_weight_kg AS "totalWeightKg",
  price_per_kg AS "pricePerKg",
  buyer,
  created_at AS "createdAt"
