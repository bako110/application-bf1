import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { LiveStackParams } from './types';

import { LiveScreen } from '../screens/LiveScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { LiveHighlightDetailScreen } from '../screens/LiveHighlightDetailScreen';

const Stack = createStackNavigator<LiveStackParams>();

export function LiveStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Live" component={LiveScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="ShowDetail" component={ShowDetailScreen} />
      <Stack.Screen name="LiveHighlightDetail" component={LiveHighlightDetailScreen} />
    </Stack.Navigator>
  );
}
