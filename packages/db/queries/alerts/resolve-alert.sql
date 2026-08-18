UPDATE alert_logs
SET resolved_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING
  id,
  batch_id AS "batchId",
  alert_type AS "alertType",
  severity,
  message_en AS "messageEn",
  message_hi AS "messageHi",
  recommendation,
  created_at AS "createdAt",
  resolved_at AS "resolvedAt"
