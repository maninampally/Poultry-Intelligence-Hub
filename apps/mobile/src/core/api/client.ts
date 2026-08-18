export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export const createApiClient = (config: ApiClientConfig) => ({
  baseUrl: config.baseUrl,
  timeoutMs: config.timeoutMs ?? 15000,
  get: async <T>(path: string): Promise<T> => {
    await Promise.resolve();
    return { path } as T;
  },
  post: async <T>(_path: string, _body: unknown): Promise<T> => {
    await Promise.resolve();
    return { ok: true } as T;
  },
});
