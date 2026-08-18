export type Migration = {
  version: number;
  up: () => void;
  down: () => void;
};

export const migrations: Migration[] = [
  {
    version: 1,
    up: () => undefined,
    down: () => undefined,
  },
];
