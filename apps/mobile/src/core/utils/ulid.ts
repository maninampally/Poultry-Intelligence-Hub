import { generateId } from './id';

/** Stable unique id for local entities (UUID v4). Name kept for existing call sites. */
export const generateUlid = (): string => generateId();
