INSERT INTO batches (
  batch_code, farm_id, shed_id, start_date, target_sale_date,
  placement_count, chick_supplier, breed, contract_type, status, notes
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING
  id,
  batch_code AS "batchCode",
  farm_id AS "farmId",
  shed_id AS "shedId",
  start_date AS "startDate",
  target_sale_date AS "targetSaleDate",
  placement_count AS "placementCount",
  chick_supplier AS "chickSupplier",
  breed,
  contract_type AS "contractType",
  status,
  notes,
  created_at AS "createdAt"
