// App.js (루트 파일)

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from './src/screens/AuthScreen';
import BroadcastListScreen from './src/screens/BroadcastListScreen';
import ConversationListScreen from './src/screens/ConversationListScreen';
import ConversationDetailScreen from './src/screens/ConversationDetailScreen';
// 필요하다면 더 import

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} />
        {/* 다른 Screen들 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}