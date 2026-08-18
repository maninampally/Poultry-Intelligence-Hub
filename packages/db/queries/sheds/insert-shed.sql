INSERT INTO sheds (farm_id, name, capacity, area_sqft)
VALUES ($1, $2, $3, $4)
RETURNING
  id,
  farm_id AS "farmId",
  name,
  capacity,
  area_sqft AS "areaSqft"
