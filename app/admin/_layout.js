import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '관리자 페이지',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: '설정 관리',
          headerBackTitle: t('common.back'),
        }}
      />
    </Stack>
  );
} 