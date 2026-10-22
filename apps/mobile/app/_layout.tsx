import '@/i18n';
import '@/theme/global.css';

import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1F5C3A' },
            headerTintColor: '#FFFFFF',
            contentStyle: { backgroundColor: '#FAF6EC' },
          }}
        />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
