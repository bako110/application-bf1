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

const Stack = createStackNavigator();

export default function HomeStack() {
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
          textAlign: 'center', // 🔥 Centre le texte du titre
        },
        // 🔥 Configuration pour centrer le titre
        headerTitleAlign: 'center', // 🔥 CECI EST LA CLÉ POUR CENTRER
        // 🔥 SUPPRIME LE BOUTON DE RETOUR
        headerLeft: () => null,
        // Supprime l'espace réservé pour le bouton
        headerLeftContainerStyle: {
          paddingLeft: 0,
        },
        // Ajuste le conteneur du titre
        headerTitleContainerStyle: {
          paddingLeft: 0,
          paddingRight: 0,
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'BF1 TV',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
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
          // 🔥 Confirmation que le bouton est supprimé même pour Home
          headerLeft: () => null,
        }}
      />
      
      {/* Pour tous les autres écrans, le bouton est déjà supprimé par screenOptions */}
      <Stack.Screen 
        name="BreakingNews" 
        component={BreakingNewsScreen}
        options={{
          title: 'Flash Info',
        }}
      />
      <Stack.Screen 
        name="JTandMag" 
        component={JTandMagScreen}
        options={{
          title: 'JT et Mag',
        }}
      />
      <Stack.Screen 
        name="Reportages" 
        component={ReportagesScreen}
        options={{
          title: 'Reportages',
        }}
      />
      <Stack.Screen 
        name="Divertissement" 
        component={DivertissementScreen}
        options={{
          title: 'Divertissement',
        }}
      />
      <Stack.Screen 
        name="Archive" 
        component={ArchiveScreen}
        options={{
          title: 'Archives',
        }}
      />
      <Stack.Screen 
        name="Program" 
        component={ProgramScreen}
        options={{
          title: 'Programmes',
        }}
      />
      <Stack.Screen 
        name="Movies" 
        component={MoviesScreen}
        options={{
          title: 'Films',
        }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={{
          title: 'Détails du Film',
        }}
      />
      <Stack.Screen 
        name="MoviePlayer" 
        component={MoviePlayerScreen}
        options={{
          title: 'Lecteur Vidéo',
        }}
      />
      <Stack.Screen 
        name="LiveShowFullScreen" 
        component={LiveShowFullScreen}
        options={{
          title: 'Live Plein Écran',
        }}
      />
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{
          title: 'Détails',
        }}
      />
      <Stack.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{
          title: 'Actualités',
        }}
      />
      <Stack.Screen 
        name="Emissions" 
        component={EmissionsScreen}
        options={{
          title: 'Émissions',
        }}
      />
      <Stack.Screen 
        name="EmissionDetail" 
        component={EmissionDetailScreen}
        options={{
          title: 'Détails de l\'Émission',
        }}
      />
      <Stack.Screen 
        name="UGC" 
        component={UGCScreen}
        options={{
          title: 'Conditions d\'Utilisation',
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{
          title: 'À propos',
        }}
      />
    </Stack.Navigator>
  );
}