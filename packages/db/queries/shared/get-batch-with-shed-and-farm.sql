SELECT
  b.id AS "batchId",
  b.batch_code AS "batchCode",
  b.farm_id AS "farmId",
  b.shed_id AS "shedId",
  b.start_date AS "startDate",
  b.target_sale_date AS "targetSaleDate",
  b.placement_count AS "placementCount",
  b.chick_supplier AS "chickSupplier",
  b.breed,
  b.contract_type AS "contractType",
  b.status,
  b.notes,
  b.created_at AS "batchCreatedAt",
  s.name AS "shedName",
  s.capacity AS "shedCapacity",
  s.area_sqft AS "shedAreaSqft",
  f.name AS "farmName",
  f.state AS "farmState",
  f.district AS "farmDistrict"
FROM batches b
INNER JOIN sheds s ON b.shed_id = s.id
INNER JOIN farms f ON b.farm_id = f.id
WHERE b.id = $1
