import { useMemo, type ReactNode } from 'react';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { useAuthStore } from '../modules/auth/auth.store';

export const RootNavigator = (): ReactNode => {
  const auth = useAuthStore();

  const view = useMemo(() => {
    if (auth.isAuthenticated) {
      return <AppNavigator />;
    }

    return <AuthNavigator />;
  }, [auth.isAuthenticated]);

  return <>{view}</>;
};
