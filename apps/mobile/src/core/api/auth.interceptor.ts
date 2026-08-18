import { tokenStore } from '../auth/token.store';

export interface RequestLike {
  headers?: Record<string, string>;
}

export const authInterceptor = {
  apply: async <T extends RequestLike>(request: T): Promise<T> => {
    const token = await tokenStore.get();
    if (!token) return request;

    return {
      ...request,
      headers: {
        ...(request.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    };
  },
};
