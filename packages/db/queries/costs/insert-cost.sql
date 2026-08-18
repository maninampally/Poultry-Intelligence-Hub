INSERT INTO cost_entries (batch_id, category, sub_category, amount, quantity, unit, date, note)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING
  id,
  batch_id AS "batchId",
  category,
  sub_category AS "subCategory",
  amount,
  quantity,
  unit,
  date,
  note,
  created_at AS "createdAt"
