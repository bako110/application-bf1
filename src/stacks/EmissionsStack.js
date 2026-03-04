import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationHeader from '../components/NotificationHeader';
import EmissionsScreen from '../screens/EmissionsScreen';
import CategoryDetailScreen from '../screens/details/CategoryDetailScreen';
import ShowDetailScreen from '../screens/details/ShowDetailScreen';
import JTandMagDetailScreen from '../screens/details/NewsDetailScreen';
import DivertissementDetailScreen from '../screens/details/MovieDetailScreen';
import ReportageDetailScreen from '../screens/details/ShowDetailScreen';
import EmissionDetailScreen from '../screens/details/EmissionDetailScreen';
import SearchScreen from '../screens/SearchScreen';

const Stack = createStackNavigator();

// Fonction pour créer le headerRight comme dans HomeStack
const createHeaderRight = (navigation, extraButtons = null) => {
  return () => (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center',
      marginRight: 16,
    }}>
      {/* Bouton de recherche */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Search')}
        style={{ 
          marginRight: 16,
          padding: 4,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="search" 
          size={22} 
          color="#E23E3E" 
        />
      </TouchableOpacity>
      
      {/* Boutons supplémentaires */}
      {extraButtons}
      
      {/* NotificationHeader */}
      <NotificationHeader />
    </View>
  );
};

export default function EmissionsStack({ navigation }) {
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
        headerTitleAlign: 'center',  // ← Centre le titre
        headerTitleContainerStyle: {
          paddingHorizontal: 16,
        },
      }}
    >
      <Stack.Screen
        name="Emissions"
        component={EmissionsScreen}
        options={({ navigation }) => ({
          title: 'Émissions',
          headerRight: createHeaderRight(navigation),
          headerLeft: () => null,  // ← Supprime le bouton retour si nécessaire
        })}
      />
      <Stack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({ navigation, route }) => ({
          title: route.params?.categoryName || 'Catégorie',
          headerRight: createHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="ShowDetail"
        component={ShowDetailScreen}
        options={({ navigation }) => ({
          title: 'Détails',
          headerRight: createHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="JTandMagDetail"
        component={JTandMagDetailScreen}
        options={({ navigation }) => ({
          title: 'JT & Magazines',
          headerRight: createHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="DivertissementDetail"
        component={DivertissementDetailScreen}
        options={({ navigation }) => ({
          title: 'Divertissement',
          headerRight: createHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="ReportageDetail"
        component={ReportageDetailScreen}
        options={({ navigation }) => ({
          title: 'Reportage',
          headerRight: createHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="EmissionDetail"
        component={EmissionDetailScreen}
        options={({ navigation }) => ({
          title: 'Détails de l\'émission',
          headerRight: createHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={({ navigation }) => ({
          title: 'Recherche',
          headerRight: createHeaderRight(navigation),
        })}
      />
    </Stack.Navigator>
  );
}