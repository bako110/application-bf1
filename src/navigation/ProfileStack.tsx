import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ProfileStackParams } from './types';

import { ProfileScreen }       from '../screens/ProfileScreen';
import { FavoritesScreen }     from '../screens/FavoritesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen }      from '../screens/SettingsScreen';
import { SupportScreen }       from '../screens/SupportScreen';
import { AboutScreen }         from '../screens/AboutScreen';
import { ShowDetailScreen }    from '../screens/ShowDetailScreen';
import { LoginScreen }         from '../screens/auth/LoginScreen';
import { RegisterScreen }      from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen }from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator<ProfileStackParams>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="Profile"        component={ProfileScreen} />
      <Stack.Screen name="Favorites"      component={FavoritesScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="Support"        component={SupportScreen} />
      <Stack.Screen name="About"          component={AboutScreen} />
      <Stack.Screen name="ShowDetail"     component={ShowDetailScreen} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
