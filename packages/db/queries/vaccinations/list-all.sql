SELECT
  id,
  batch_id AS "batchId",
  vaccine_name AS "vaccineName",
  dose_date AS "doseDate",
  dose_number AS "doseNumber",
  cost,
  batch_no AS "batchNo",
  route,
  administered_by AS "administeredBy",
  created_at AS "createdAt"
FROM vaccination_logs
ORDER BY created_at ASC
