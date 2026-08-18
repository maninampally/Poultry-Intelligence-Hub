export type DbRecord = Record<string, unknown>;

export interface DatabaseLike {
  write<T>(callback: () => Promise<T> | T): Promise<T>;
  get<T>(tableName: string): { create: (builder: (record: T) => void) => Promise<T> };
}

export const database: DatabaseLike = {
  async write<T>(callback: () => Promise<T> | T): Promise<T> {
    return await callback();
  },
  get<T>(_tableName: string) {
    return {
      create: async (builder: (record: T) => void) => {
        const record = {} as T;
        builder(record);
        return record;
      },
    };
  },
};
