SELECT
  batch_id AS "batchId",
  tenant_id AS "tenantId",
  placement_count AS "placementCount",
  cumulative_mortality AS "cumulativeMortality",
  live_bird_count AS "liveBirdCount",
  mortality_percent AS "mortalityPercent",
  last_processed_event_id AS "lastProcessedEventId",
  projection_status AS "projectionStatus",
  last_calculated_at AS "lastCalculatedAt"
FROM app.batch_metrics
WHERE batch_id = $1
