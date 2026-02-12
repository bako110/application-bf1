import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LiveScreen from './LiveScreen';
import LiveShowFullScreen from './LiveShowFullScreen';

const Stack = createStackNavigator();

export default function LiveStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Live" component={LiveScreen} />
      <Stack.Screen name="LiveShowFullScreen" component={LiveShowFullScreen} />
    </Stack.Navigator>
  );
}
