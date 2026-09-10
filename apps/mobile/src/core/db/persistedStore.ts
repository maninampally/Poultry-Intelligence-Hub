import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage keys for durable offline state (survives app restart). */
export const storageKeys = {
  syncOutbox: '@murgi_mitra/sync_outbox',
  syncCursor: '@murgi_mitra/sync_cursor',
  mortalityEvents: '@murgi_mitra/mortality_events',
} as const;

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
