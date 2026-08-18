INSERT INTO alert_logs (batch_id, alert_type, severity, message_en, message_hi, recommendation, created_at)
VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP))
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
