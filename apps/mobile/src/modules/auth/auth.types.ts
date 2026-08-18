export interface AuthUser {
  id: string;
  phone: string;
  name: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string;
}
