import { runQuery } from "../sqlLoader";

export interface Farm {
  id: string;
  name: string;
  ownerName: string;
  state: string;
  district: string;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}

export async function insertFarm(farm: {
  name: string;
  ownerName: string;
  state: string;
  district: string;
  village?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<Farm> {
  const rows = await runQuery<Farm>("farms/insert-farm.sql", [
    farm.name,
    farm.ownerName,
    farm.state,
    farm.district,
    farm.village ?? null,
    farm.latitude ?? null,
    farm.longitude ?? null,
  ]);
  return rows[0];
}

export async function listFarms(): Promise<Farm[]> {
  return runQuery<Farm>("farms/list-farms.sql");
}

export async function getFarmById(farmId: string): Promise<Farm | null> {
  const rows = await runQuery<Farm>("farms/get-farm-by-id.sql", [farmId]);
  return rows[0] ?? null;
}
