SELECT
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
FROM cost_entries
WHERE batch_id = $1
ORDER BY date ASC
