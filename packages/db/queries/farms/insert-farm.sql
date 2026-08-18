INSERT INTO farms (name, owner_name, state, district, village, latitude, longitude)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING
  id,
  name,
  owner_name AS "ownerName",
  state,
  district,
  village,
  latitude,
  longitude,
  created_at AS "createdAt"
