let currentToken: string | null = null;

export const tokenStore = {
  get: async (): Promise<string | null> => currentToken,
  set: async (token: string): Promise<void> => {
    currentToken = token;
  },
  clear: async (): Promise<void> => {
    currentToken = null;
  },
};
