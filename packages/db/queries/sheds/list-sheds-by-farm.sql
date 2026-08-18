SELECT
  id,
  farm_id AS "farmId",
  name,
  capacity,
  area_sqft AS "areaSqft"
FROM sheds
WHERE farm_id = $1
