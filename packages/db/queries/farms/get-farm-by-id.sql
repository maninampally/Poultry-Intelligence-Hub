SELECT
  id,
  name,
  owner_name AS "ownerName",
  state,
  district,
  village,
  latitude,
  longitude,
  created_at AS "createdAt"
FROM farms
WHERE id = $1
