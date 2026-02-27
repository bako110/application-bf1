import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LiveScreen from '../screens/LiveScreen';
import LiveShowFullScreen from '../screens/details/LiveShowFullScreen';
import NotificationHeader from '../components/NotificationHeader';

const Stack = createStackNavigator();

export default function LiveStack() {
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
        headerTitleContainerStyle: {
          paddingLeft: 20,
        },
        headerLeftContainerStyle: {
          paddingLeft: 46,
        },
      }}
    >
      <Stack.Screen 
        name="Live" 
        component={LiveScreen}
        options={{
          title: 'BF1 Live',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  // Fonction de rafraîchissement du live si nécessaire
                }}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons 
                  name="refresh" 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              <NotificationHeader />
            </View>
          ),
        }}
      />
      <Stack.Screen 
        name="LiveShowFullScreen" 
        component={LiveShowFullScreen}
        options={{ 
          title: 'Live Fullscreen',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <NotificationHeader />
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
}
