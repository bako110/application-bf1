import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProgramScreen from '../screens/ProgramScreen';
import ShowDetailScreen from '../screens/details/ShowDetailScreen';
import NotificationHeader from '../components/NotificationHeader';

const Stack = createStackNavigator();

// Composant bouton de filtre séparé pour meilleure gestion
const FilterButton = ({ route, navigation }) => {
  const hasActiveFilters = route.params?.hasActiveFilters || false;
  
  const handlePress = () => {
    if (route.params?.openFilterModal) {
      route.params.openFilterModal();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={{ 
        marginRight: 12, 
        padding: 10,
        position: 'relative',
        backgroundColor: hasActiveFilters ? 'rgba(226, 62, 62, 0.15)' : 'transparent',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: hasActiveFilters ? '#E23E3E' : 'transparent',
      }}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={hasActiveFilters ? "filter" : "filter-outline"} 
        size={24} 
        color="#E23E3E" 
      />
      {hasActiveFilters && (
        <View style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#E23E3E',
          borderWidth: 2,
          borderColor: '#000000',
        }} />
      )}
    </TouchableOpacity>
  );
};

export default function ProgramStack() {
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
        name="ProgramList" 
        component={ProgramScreen}
        options={({ route, navigation }) => ({
          title: 'Programmes',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginRight: 4,
            }}>
              <FilterButton route={route} navigation={navigation} />
              <NotificationHeader />
            </View>
          ),
        })}
      />
      <Stack.Screen 
        name="ShowDetail" 
        component={ShowDetailScreen}
        options={{ 
          title: 'Détails du Programme',
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
