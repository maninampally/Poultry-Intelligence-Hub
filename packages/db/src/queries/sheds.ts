import { runQuery } from "../sqlLoader";

export interface Shed {
  id: string;
  farmId: string;
  name: string;
  capacity: number;
  areaSqft: number;
}

export async function insertShed(shed: {
  farmId: string;
  name: string;
  capacity: number;
  areaSqft: number;
}): Promise<Shed> {
  const rows = await runQuery<Shed>("sheds/insert-shed.sql", [
    shed.farmId,
    shed.name,
    shed.capacity,
    shed.areaSqft,
  ]);
  return rows[0];
}

export async function listShedsByFarm(farmId: string): Promise<Shed[]> {
  return runQuery<Shed>("sheds/list-sheds-by-farm.sql", [farmId]);
}

export async function getShedById(shedId: string): Promise<Shed | null> {
  const rows = await runQuery<Shed>("sheds/get-shed-by-id.sql", [shedId]);
  return rows[0] ?? null;
}
