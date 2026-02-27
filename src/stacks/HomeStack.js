import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationHeader from '../components/NotificationHeader';
import HomeScreen from '../screens/HomeScreen';
import BreakingNewsScreen from '../screens/BreakingNewsScreen';
import JTandMagScreen from '../screens/JTandMagScreen';
import ReportagesScreen from '../screens/ReportagesScreen';
import DivertissementScreen from '../screens/DivertissementScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import ProgramScreen from '../screens/ProgramScreen';
import MoviesScreen from '../screens/MoviesScreen';
import EmissionsScreen from '../screens/EmissionsScreen';
import MovieDetailScreen from '../screens/details/MovieDetailScreen';
import MoviePlayerScreen from '../screens/details/MoviePlayerScreen';
import LiveShowFullScreen from '../screens/details/LiveShowFullScreen';
import ShowDetailScreen from '../screens/details/ShowDetailScreen';
import NewsDetailScreen from '../screens/details/NewsDetailScreen';
import EmissionDetailScreen from '../screens/details/EmissionDetailScreen';
import UGCScreen from '../screens/UGCScreen';
import AboutScreen from '../screens/AboutScreen';
import SearchScreen from '../screens/SearchScreen';

const Stack = createStackNavigator();

// Fonction pour créer le headerRight de manière cohérente avec les autres écrans
const createHeaderRight = (navigation, extraButtons = null) => {
  return () => (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center',
      marginRight: 16,
    }}>
      {/* Bouton de recherche - comme dans les autres écrans */}
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
      
      {/* Boutons supplémentaires (comme le filtre) */}
      {extraButtons}
      
      {/* NotificationHeader avec le même style que les autres */}
      <NotificationHeader />
    </View>
  );
};

export default function HomeStack() {
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
        headerTitleAlign: 'center',
        headerLeft: () => null,
        headerTitleContainerStyle: {
          paddingHorizontal: 16,
        },
      }}
    >
      {/* Écran d'accueil */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={({ navigation }) => ({
          title: 'BF1 TV',
          headerRight: createHeaderRight(navigation),
          headerLeft: () => null,
        })}
      />
      
      {/* Recherche */}
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={({ navigation }) => ({
          title: 'Recherche',
          headerRight: createHeaderRight(navigation),
          headerLeft: () => null,
        })}
      />
      
      {/* Flash Info */}
      <Stack.Screen 
        name="BreakingNews" 
        component={BreakingNewsScreen}
        options={({ navigation }) => ({
          title: 'Flash Info',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* JT et Mag */}
      <Stack.Screen 
        name="JTandMag" 
        component={JTandMagScreen}
        options={({ navigation }) => ({
          title: 'JT et Mag',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Reportages */}
      <Stack.Screen 
        name="Reportages" 
        component={ReportagesScreen}
        options={({ navigation }) => ({
          title: 'Reportages',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* DIVERTISSEMENT - Maintenant avec le même header que les autres */}
      <Stack.Screen 
        name="Divertissement" 
        component={DivertissementScreen}
        options={({ navigation }) => ({
          title: 'Divertissement',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Archives */}
      <Stack.Screen 
        name="Archive" 
        component={ArchiveScreen}
        options={({ route, navigation }) => ({
          title: 'Archives',
          headerRight: () => {
            // Créer le bouton de changement de vue
            const viewModeButton = (
              <TouchableOpacity 
                onPress={() => route.params?.toggleViewMode?.()}
                style={{ marginRight: 16, padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={route.params?.viewMode === 'grid' ? 'list' : 'grid'} 
                  size={22} 
                  color="#E23E3E" 
                />
              </TouchableOpacity>
            );
            
            // Utiliser la même structure que les autres
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Search')}
                  style={{ marginRight: 16, padding: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="search" size={22} color="#E23E3E" />
                </TouchableOpacity>
                {viewModeButton}
                <NotificationHeader />
              </View>
            );
          },
        })}
      />
      
      {/* Programmes */}
     <Stack.Screen 
  name="Program" 
  component={ProgramScreen}
  options={({ route, navigation }) => ({
    title: 'Programmes',
    headerRight: () => (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: 12, // espace global à droite
        }}
      >
        {/* Bouton Search */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={{ paddingHorizontal: 6 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="search" size={20} color="#E23E3E" />
        </TouchableOpacity>

        {/* Bouton Filter */}
        <TouchableOpacity
          onPress={() => route.params?.openFilterModal?.()}
          style={{
            paddingHorizontal: 6,
            position: 'relative',
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={
              route.params?.hasActiveFilters
                ? 'filter'
                : 'filter-outline'
            }
            size={20}
            color="#E23E3E"
          />

          {route.params?.hasActiveFilters && (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#E23E3E',
              }}
            />
          )}
        </TouchableOpacity>

        {/* Notifications */}
        <View style={{ marginLeft: 4 }}>
          <NotificationHeader />
        </View>
      </View>
    ),
  })}
/>
      
      {/* Films */}
      <Stack.Screen 
        name="Movies" 
        component={MoviesScreen}
        options={({ navigation }) => ({
          title: 'Films',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Détails du Film */}
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={({ navigation }) => ({
          title: 'Détails du Film',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Lecteur Vidéo */}
      <Stack.Screen 
        name="MoviePlayer" 
        component={MoviePlayerScreen}
        options={{
          title: 'Lecteur Vidéo',
          headerShown: false, // Cacher le header pour le lecteur vidéo
        }}
      />
      
      {/* Live Plein Écran */}
      <Stack.Screen 
        name="LiveShowFullScreen" 
        component={LiveShowFullScreen}
        options={{
          title: 'Live Plein Écran',
          headerShown: false, // Cacher le header pour le live
        }}
      />
      
      {/* Détails de l'émission */}
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={({ navigation }) => ({
          title: 'Détails',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Détails des actualités */}
      <Stack.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={({ navigation }) => ({
          title: 'Actualités',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Émissions */}
      <Stack.Screen 
        name="Emissions" 
        component={EmissionsScreen}
        options={({ navigation }) => ({
          title: 'Émissions',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Détails de l'émission */}
      <Stack.Screen 
        name="EmissionDetail" 
        component={EmissionDetailScreen}
        options={({ navigation }) => ({
          title: "Détails de l'Émission",
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* Conditions d'Utilisation */}
      <Stack.Screen 
        name="UGC" 
        component={UGCScreen}
        options={({ navigation }) => ({
          title: 'Conditions d\'Utilisation',
          headerRight: createHeaderRight(navigation),
        })}
      />
      
      {/* À propos */}
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={({ navigation }) => ({
          title: 'À propos',
          headerRight: createHeaderRight(navigation),
        })}
      />
    </Stack.Navigator>
  );
}