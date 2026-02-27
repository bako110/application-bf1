import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProgramScreen from '../screens/ProgramScreen';
import ShowDetailScreen from '../screens/details/ShowDetailScreen';
import NotificationHeader from '../components/NotificationHeader';

const Stack = createStackNavigator();

export default function ProgramStack() {
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
        name="ProgramList" 
        component={ProgramScreen}
        options={{
          title: 'Programmes',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  // Fonction de filtre ou de recherche si nécessaire
                }}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons 
                  name="search" 
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
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{ 
          title: 'Détails du Programme',
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
