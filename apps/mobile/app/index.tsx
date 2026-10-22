import React from 'react';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function Index(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-surface-background p-6">
      <Text className="text-display text-brand-700">{t('common.appName')}</Text>
      <Text className="mt-2 text-body text-ink-muted">
        {t('home.scaffoldDescription')}
      </Text>
      <Link
        href="/dev/components"
        className="mt-6 min-h-touch-primary justify-center rounded-control bg-brand-700 px-6 py-4 text-label text-ink-onBrand"
      >
        {t('home.componentPreview')}
      </Link>
    </View>
  );
}
