import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationHeader from '../components/NotificationHeader';
import HomeScreen from './HomeScreen';
import BreakingNewsScreen from './BreakingNewsScreen';
import TrendingShowsScreen from './TrendingShowsScreen';
import RecentVideosScreen from './RecentVideosScreen';
import PopularProgramsScreen from './PopularProgramsScreen';
import InterviewsScreen from './InterviewsScreen';
import ArchiveScreen from './ArchiveScreen';
import ProgramScreen from './ProgramScreen';
import MoviesScreen from './MoviesScreen';
import MovieDetailScreen from './MovieDetailScreen';
import MoviePlayerScreen from './MoviePlayerScreen';
import LiveShowFullScreen from './LiveShowFullScreen';
import ShowDetailScreen from './ShowDetailScreen';
import NewsDetailScreen from './NewsDetailScreen';

const Stack = createStackNavigator();

export default function HomeStack() {
  const renderNotificationHeader = React.useCallback(() => <NotificationHeader />, []);
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeftContainerStyle: {
          paddingLeft: 26, // 16px par défaut + 10px = 26px
        },
        headerRight: renderNotificationHeader,
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="BreakingNews" 
        component={BreakingNewsScreen}
        options={({ navigation, route }) => ({
          title: 'Flash Info',
          headerLeft: () => null,
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
        name="TrendingShows" 
        component={TrendingShowsScreen}
        options={({ navigation, route }) => ({
          title: 'Émissions Tendances',
          headerLeft: () => null,
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
        name="RecentVideos" 
        component={RecentVideosScreen}
        options={({ navigation, route }) => ({
          title: 'Vidéos Récentes',
          headerLeft: () => null,
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
        name="PopularPrograms" 
        component={PopularProgramsScreen}
        options={{ title: 'Programmes Populaires', headerLeft: () => null }}
      />
      <Stack.Screen 
        name="Interviews" 
        component={InterviewsScreen}
        options={{ title: 'Interviews', headerLeft: () => null }}
      />
      <Stack.Screen 
        name="Archive" 
        component={ArchiveScreen}
        options={{ title: 'Archives', headerLeft: () => null }}
      />
      <Stack.Screen 
        name="ProgramScreen" 
        component={ProgramScreen}
        options={({ navigation, route }) => ({
          title: 'Programme EPG',
          headerLeft: () => null,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  // Accéder à la fonction setFilterModal via les params de navigation
                  if (route.params?.openFilterModal) {
                    route.params.openFilterModal();
                  }
                }}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons name="filter" size={24} color="#DC143C" />
              </TouchableOpacity>
              <NotificationHeader />
            </View>
          ),
        })}
      />
      <Stack.Screen 
        name="Movies" 
        component={MoviesScreen}
        options={{ title: 'Films', headerLeft: () => null }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={{ title: 'Détails du Film' }}
      />
      <Stack.Screen 
        name="MoviePlayer" 
        component={MoviePlayerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LiveShowFullScreen" 
        component={LiveShowFullScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{ title: 'Détails' }}
      />
      <Stack.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{ title: 'Actualité' }}
      />
      </Stack.Navigator>
  );
}
