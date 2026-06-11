import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { HomeStackParams } from './types';

import { HomeScreen }           from '../screens/HomeScreen';
import { ShowDetailScreen }     from '../screens/ShowDetailScreen';
import { NewsDetailScreen }     from '../screens/NewsDetailScreen';
import { NewsScreen }           from '../screens/content/NewsScreen';
import { MissedScreen }         from '../screens/content/MissedScreen';
import { JTandMagScreen }       from '../screens/content/JTandMagScreen';
import { MagazineScreen }       from '../screens/content/MagazineScreen';
import { SportsScreen }         from '../screens/content/SportsScreen';
import { DivertissementScreen } from '../screens/content/DivertissementScreen';
import { ReportagesScreen }     from '../screens/content/ReportagesScreen';
import { ArchiveScreen }        from '../screens/content/ArchiveScreen';
import { TeleRealiteScreen }    from '../screens/content/TeleRealiteScreen';
import { SearchScreen }              from '../screens/SearchScreen';
import { EmissionCategoryScreen }   from '../screens/EmissionCategoryScreen';
import { ProgramsScreen }           from '../screens/ProgramsScreen';

const Stack = createStackNavigator<HomeStackParams>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="Home"             component={HomeScreen} />
      <Stack.Screen name="ShowDetail"       component={ShowDetailScreen} />
      <Stack.Screen name="NewsDetail"       component={NewsDetailScreen} />
      <Stack.Screen name="NewsPage"         component={NewsScreen} />
      <Stack.Screen name="MissedPage"       component={MissedScreen} />
      <Stack.Screen name="JTandMagPage"     component={JTandMagScreen} />
      <Stack.Screen name="MagazinePage"     component={MagazineScreen} />
      <Stack.Screen name="SportsPage"       component={SportsScreen} />
      <Stack.Screen name="DivertissementPage" component={DivertissementScreen} />
      <Stack.Screen name="ReportagesPage"   component={ReportagesScreen} />
      <Stack.Screen name="ArchivePage"      component={ArchiveScreen} />
      <Stack.Screen name="TeleRealitePage"  component={TeleRealiteScreen} />
      <Stack.Screen name="EmissionCategory" component={EmissionCategoryScreen} />
      <Stack.Screen name="Programs"         component={ProgramsScreen} />
      <Stack.Screen name="Search"           component={SearchScreen} />
    </Stack.Navigator>
  );
}
