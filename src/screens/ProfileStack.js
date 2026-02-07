import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from './ProfileScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import FavoritesScreen from './FavoritesScreen';

const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{
          headerShown: true,
          headerTitle: 'Mes Favoris',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
}
