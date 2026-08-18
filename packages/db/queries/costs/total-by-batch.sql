SELECT COALESCE(SUM(amount), 0) AS "total"
FROM cost_entries
WHERE batch_id = $1
