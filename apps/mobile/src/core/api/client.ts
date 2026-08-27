export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export const createApiClient = (config: ApiClientConfig) => ({
  baseUrl: config.baseUrl,
  timeoutMs: config.timeoutMs ?? 15000,
  get: async <T>(path: string, token?: string): Promise<T> => {
    const response = await fetch(`${config.baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
    return (await response.json()) as T;
  },
  post: async <T>(path: string, body: unknown, token?: string): Promise<T> => {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`POST ${path} failed with ${response.status}`);
    return (await response.json()) as T;
  },
});
