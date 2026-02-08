import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotificationHeader from '../components/NotificationHeader';
import HomeScreen from './HomeScreen';
import BreakingNewsScreen from './BreakingNewsScreen';
import TrendingShowsScreen from './TrendingShowsScreen';
import RecentVideosScreen from './RecentVideosScreen';
import PopularProgramsScreen from './PopularProgramsScreen';
import InterviewsScreen from './InterviewsScreen';
import LiveShowFullScreen from './LiveShowFullScreen';
import ShowDetailScreen from './ShowDetailScreen';
import NewsDetailScreen from './NewsDetailScreen';

const Stack = createStackNavigator();

export default function HomeStack() {
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
        headerRight: () => <NotificationHeader />,
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ title: 'Accueil' }}
      />
      <Stack.Screen 
        name="BreakingNews" 
        component={BreakingNewsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TrendingShows" 
        component={TrendingShowsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecentVideos" 
        component={RecentVideosScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PopularPrograms" 
        component={PopularProgramsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Interviews" 
        component={InterviewsScreen}
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
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
