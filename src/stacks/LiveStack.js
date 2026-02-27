import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LiveScreen from '../screens/LiveScreen';
import LiveShowFullScreen from '../screens/details/LiveShowFullScreen';
import ShowDetailScreen from '../screens/details/ShowDetailScreen';
import EmissionDetailScreen from '../screens/details/EmissionDetailScreen';
import NotificationHeader from '../components/NotificationHeader';

const Stack = createStackNavigator();

export default function LiveStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#000000',
          borderBottomWidth: 1,
          borderBottomColor: '#E23E3E',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#E23E3E',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: '#FFFFFF',
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
        options={({ navigation }) => ({
          headerShown: false, // Masquer le header en plein écran
          tabBarStyle: { display: 'none' }, // Masquer le footer (tabs)
          // Configuration pour masquer les tabs du parent TabNavigator
          tabBarVisible: false,
        })}
      />
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{
          title: 'Détails',
        }}
      />
      <Stack.Screen 
        name="EmissionDetail" 
        component={EmissionDetailScreen}
        options={{
          title: "Détails de l'Émission",
        }}
      />
    </Stack.Navigator>
  );
}
