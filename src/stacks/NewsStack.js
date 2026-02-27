import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/details/NewsDetailScreen';
import NotificationHeader from '../components/NotificationHeader';

const Stack = createStackNavigator();

export default function NewsStack() {
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
        name="NewsList" 
        component={NewsScreen}
        options={{
          title: 'Actualités',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  // Fonction de filtre par catégorie si nécessaire
                }}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons 
                  name="funnel" 
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
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{ 
          title: 'Détails de l\'Actualité',
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
