export const generateUlid = (): string => `ulid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
