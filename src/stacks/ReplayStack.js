import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationHeader from '../components/NotificationHeader';
import EmissionsScreen from '../screens/sportScreen';
import EmissionDetailScreen from '../screens/details/EmissionDetailScreen';
import ReportagesScreen from '../screens/ReportagesScreen';
import ShowDetailScreen from '../screens/details/ShowDetailScreen';
import NewsDetailScreen from '../screens/details/NewsDetailScreen';
import MovieDetailScreen from '../screens/details/MovieDetailScreen';

const Stack = createStackNavigator();

export default function EmissionsStack() {
  const renderNotificationHeader = React.useCallback(() => <NotificationHeader />, []);

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
        name="EmissionsMain" 
        component={EmissionsScreen}
        options={{
          title: 'Émissions',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  // Fonction de recherche si nécessaire
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
        name="EmissionDetail" 
        component={EmissionDetailScreen}
        options={{ title: 'Détails de l\'émission' }}
      />
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{ title: 'Détails' }}
      />
      <Stack.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{ title: 'Actualités' }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={{ title: 'Film' }}
      />
    </Stack.Navigator>
  );
}
