export interface AuthStoreState {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
}

const authStore: AuthStoreState = {
  isAuthenticated: false,
  userId: null,
  token: null,
};

export const useAuthStore = () => authStore;

export const authenticateUser = (userId: string, token: string) => {
  authStore.isAuthenticated = true;
  authStore.userId = userId;
  authStore.token = token;
};

export const unauthenticateUser = () => {
  authStore.isAuthenticated = false;
  authStore.userId = null;
  authStore.token = null;
};
