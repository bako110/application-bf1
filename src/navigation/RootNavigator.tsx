import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootTabParams } from './types';

import { HomeStack }      from './HomeStack';
import { EmissionsStack } from './EmissionsStack';
import { ProfileStack }   from './ProfileStack';
import { LiveScreen }     from '../screens/LiveScreen';
import { ReelsScreen }    from '../screens/ReelsScreen';
import { TabBar }         from './TabBar';

const Tab = createBottomTabNavigator<RootTabParams>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"      component={HomeStack} />
      <Tab.Screen name="EmissionsTab" component={EmissionsStack} />
      <Tab.Screen name="LiveTab"      component={LiveScreen} />
      <Tab.Screen name="ReelsTab"     component={ReelsScreen} />
      <Tab.Screen name="ProfileTab"   component={ProfileStack} />
    </Tab.Navigator>
  );
}
