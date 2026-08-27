const runtimeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;

export const apiBaseUrl = runtimeProcess?.env?.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
