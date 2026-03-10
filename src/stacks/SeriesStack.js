import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SeriesScreen from '../screens/SeriesScreen';
import SeriesDetailScreen from '../screens/details/SeriesDetailScreen';
import SeasonDetailScreen from '../screens/details/SeasonDetailScreen';
import EpisodePlayerScreen from '../screens/details/EpisodePlayerScreen';
import NotificationHeader from '../components/NotificationHeader';

const Stack = createStackNavigator();

export default function SeriesStack() {
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
        name="SeriesList" 
        component={SeriesScreen}
        options={{
          title: 'Séries',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  // Fonction de filtre par genre si nécessaire
                }}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons 
                  name="filter" 
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
        name="SeriesDetail" 
        component={SeriesDetailScreen}
        options={{ 
          title: 'Détails de la Série',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <NotificationHeader />
            </View>
          ),
        }}
      />
      <Stack.Screen 
        name="SeasonDetail" 
        component={SeasonDetailScreen}
        options={{ 
          title: 'Saison',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <NotificationHeader />
            </View>
          ),
        }}
      />
      <Stack.Screen 
        name="EpisodePlayer" 
        component={EpisodePlayerScreen}
        options={{ 
          title: 'Lecture',
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
