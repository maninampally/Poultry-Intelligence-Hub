export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export const session = {
  current: null as Session | null,
  set: (next: Session | null) => {
    session.current = next;
  },
  clear: () => {
    session.current = null;
  },
};
