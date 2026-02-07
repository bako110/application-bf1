import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="BreakingNews" component={BreakingNewsScreen} />
      <Stack.Screen name="TrendingShows" component={TrendingShowsScreen} />
      <Stack.Screen name="RecentVideos" component={RecentVideosScreen} />
      <Stack.Screen name="PopularPrograms" component={PopularProgramsScreen} />
      <Stack.Screen name="Interviews" component={InterviewsScreen} />
      <Stack.Screen name="LiveShowFullScreen" component={LiveShowFullScreen} />
      <Stack.Screen name="ShowDetail" component={ShowDetailScreen} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
    </Stack.Navigator>
  );
}
