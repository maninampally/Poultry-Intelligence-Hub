-- Active mortality events from the FastAPI ledger (excludes superseded rows).
-- Used by Express GET during dual-stack so web can see farmer sync writes.
SELECT
  e.id,
  m.batch_id AS "batchId",
  m.shed_id AS "shedId",
  e.occurred_at AS date,
  CASE
    WHEN m.shift IN ('morning', 'evening') THEN m.shift
    ELSE 'morning'
  END AS shift,
  m.count,
  COALESCE(m.cause, 'unknown') AS cause,
  NULL::text AS notes,
  NULL::text AS photoUrl,
  e.created_at AS "createdAt"
FROM app.mortality_events m
JOIN app.farm_events e ON e.id = m.event_id
WHERE m.batch_id = $1
  AND NOT EXISTS (
    SELECT 1
    FROM app.farm_events correction
    WHERE correction.supersedes_event_id = e.id
  )
ORDER BY e.occurred_at DESC, m.shift DESC
