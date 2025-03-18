import React from 'react';
import { Redirect } from 'expo-router';

// 가장 단순한 형태의 리디렉션
export default function Root() {
  return <Redirect href="/(tabs)" />;
}