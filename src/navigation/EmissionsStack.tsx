import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { EmissionsStackParams } from './types';

import { EmissionsScreen }         from '../screens/EmissionsScreen';
import { EmissionDetailScreen }    from '../screens/EmissionDetailScreen';
import { EmissionCategoryScreen }  from '../screens/EmissionCategoryScreen';
import { ShowDetailScreen }        from '../screens/ShowDetailScreen';

const Stack = createStackNavigator<EmissionsStackParams>();

export function EmissionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="Emissions"        component={EmissionsScreen} />
      <Stack.Screen name="EmissionDetail"   component={EmissionDetailScreen} />
      <Stack.Screen name="EmissionCategory" component={EmissionCategoryScreen} />
      <Stack.Screen name="ShowDetail"       component={ShowDetailScreen} />
    </Stack.Navigator>
  );
}
