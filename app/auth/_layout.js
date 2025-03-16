import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: t('auth.authentication'),
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: t('auth.login'),
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: t('auth.register'),
        }}
      />
    </Stack>
  );
}