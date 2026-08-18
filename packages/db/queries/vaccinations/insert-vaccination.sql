INSERT INTO vaccination_logs (batch_id, vaccine_name, dose_date, dose_number, cost, batch_no, route, administered_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING
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
