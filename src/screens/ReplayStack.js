import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationHeader from '../components/NotificationHeader';
import RecentVideosScreen from './RecentVideosScreen';
import ShowDetailScreen from './ShowDetailScreen';

const Stack = createStackNavigator();

export default function ReplayStack() {
  const renderNotificationHeader = React.useCallback(() => <NotificationHeader />, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#000000',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerLeftContainerStyle: {
          paddingLeft: 26,
        },
        headerRight: renderNotificationHeader,
      }}
    >
      <Stack.Screen 
        name="ReplayMain" 
        component={RecentVideosScreen}
        options={({ navigation, route }) => ({
          title: 'Replay',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  if (route.params?.toggleViewMode) {
                    route.params.toggleViewMode();
                  }
                }}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons 
                  name={route.params?.viewMode === 'grid' ? 'list' : 'grid'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              <NotificationHeader />
            </View>
          ),
        })}
      />
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{ title: 'Détails' }}
      />
    </Stack.Navigator>
  );
}
