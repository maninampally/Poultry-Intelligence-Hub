SELECT
  id,
  batch_id AS "batchId",
  alert_type AS "alertType",
  severity,
  message_en AS "messageEn",
  message_hi AS "messageHi",
  recommendation,
  created_at AS "createdAt",
  resolved_at AS "resolvedAt"
FROM alert_logs
WHERE batch_id = $1
ORDER BY created_at ASC
