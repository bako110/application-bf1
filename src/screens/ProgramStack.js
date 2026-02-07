import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProgramScreen from './ProgramScreen';
import ShowDetailScreen from './ShowDetailScreen';

const Stack = createStackNavigator();

export default function ProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramList" component={ProgramScreen} />
      <Stack.Screen name="ShowDetail" component={ShowDetailScreen} />
    </Stack.Navigator>
  );
}
