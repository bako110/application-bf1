import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NewsScreen from './NewsScreen';
import NewsDetailScreen from './NewsDetailScreen';

const Stack = createStackNavigator();

export default function NewsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewsList" component={NewsScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
    </Stack.Navigator>
  );
}
