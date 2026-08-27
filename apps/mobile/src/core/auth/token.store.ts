export const tokenStore = {
  get: async (): Promise<string | null> => {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  set: async (_token: string): Promise<void> => undefined,
  clear: async (): Promise<void> => {
    const { supabase } = await import('./supabase');
    await supabase.auth.signOut();
  },
};
