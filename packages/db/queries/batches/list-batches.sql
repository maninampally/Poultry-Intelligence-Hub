SELECT
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
FROM batches
ORDER BY start_date ASC
