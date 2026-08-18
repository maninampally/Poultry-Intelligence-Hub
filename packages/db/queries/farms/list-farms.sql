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
ORDER BY created_at ASC
