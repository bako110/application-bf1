import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MoviesScreen from './MoviesScreen';
import MovieDetailScreen from './MovieDetailScreen';
import MoviePlayerScreen from './MoviePlayerScreen';

const Stack = createStackNavigator();

export default function MoviesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoviesList" component={MoviesScreen} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen name="MoviePlayer" component={MoviePlayerScreen} />
    </Stack.Navigator>
  );
}
