import { useEffect, type ReactNode } from 'react';
import { RootNavigator } from '../navigation/RootNavigator';
import { AuthService } from '../modules/auth/auth.service';

export default function RootLayout(): ReactNode {
  useEffect(() => {
    void AuthService.restoreSession();
  }, []);

  return <RootNavigator />;
}
