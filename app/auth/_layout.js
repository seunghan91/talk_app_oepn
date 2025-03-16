import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: t('auth.login'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: t('auth.register'),
          headerBackTitle: t('common.back'),
        }}
      />
    </Stack>
  );
} 