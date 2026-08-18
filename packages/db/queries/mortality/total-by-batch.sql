SELECT COALESCE(SUM(count), 0)::int AS "total"
FROM mortality_logs
WHERE batch_id = $1
