import React from 'react';
import { View, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Stacks
import { HomeStack, ProgramStack, EmissionsStack, ProfileStack } from '../../stacks';
import LiveScreen from '../../screens/LiveScreen';
import ReelScreen from '../../screens/ReelScreen';

const Tab = createBottomTabNavigator();

// ===== Wrapper pour FloatingMenuButton avec navigation state =====
export function NavigationWrapper({ children, onTabChange }) {
  return (
    <>
      <TabNavigator onTabChange={onTabChange} />
      {children}
    </>
  );
}

// ===== Composant personnalisé pour le bouton Live =====
export const LiveTabButton = ({ focused, onPress }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Animation pulse douce et continue pour indiquer le direct
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    
    // Animation d'opacité pour l'effet "live" (rouge qui pulse)
    const opacity = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    
    pulse.start();
    opacity.start();
    return () => {
      pulse.stop();
      opacity.stop();
    };
  }, []);

  return (
    <TouchableOpacity 
      style={{
        top: -15,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 20,
      }}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Animated.View style={{
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: '#DC143C',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DC143C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: focused ? 0.4 : 0.2,
        shadowRadius: 5,
        elevation: 15,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        transform: [{ scale: pulseAnim }],
        opacity: opacityAnim,
      }}>
        <Ionicons 
          name="radio"
          size={28}
          color="#FFFFFF"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ===== Tab Navigator avec adaptation SafeArea =====
export function TabNavigator({ onTabChange }) {
  const insets = useSafeAreaInsets();
  
  // Calculer la hauteur du TabBar
  const tabBarHeight = 60 + insets.bottom;
  const tabBarPaddingBottom = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenListeners={{
        state: (e) => {
          const state = e.data.state;
          if (state && onTabChange) {
            const currentRoute = state.routes[state.index];
            onTabChange(currentRoute.name);
          }
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          let iconSize = 22;
          
          // Ne pas définir d'icône pour l'onglet Direct car il utilise LiveTabButton
          if (route.name === 'Direct') {
            return null;
          }
          
          switch (route.name) {
            case 'Accueil': 
              iconName = focused ? 'home' : 'home-outline'; 
              break;
            case 'Émissions': 
              iconName = focused ? 'tv' : 'tv-outline'; 
              break;
            case 'Reels': 
              iconName = focused ? 'play-circle' : 'play-circle-outline'; 
              break;
            case 'Mon compte': 
              iconName = focused ? 'person-circle' : 'person-circle-outline'; 
              break;
          }
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#DC143C',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          elevation: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
      })}
    >
      <Tab.Screen 
        name="Accueil" 
        component={HomeStack} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Accueil',
        }} 
      />
      
      <Tab.Screen 
        name="Émissions" 
        component={EmissionsStack}
        options={{
          tabBarLabel: 'Émissions',
        }}
      />
      
      <Tab.Screen 
        name="Direct" 
        component={LiveScreen} 
        options={{ 
          headerShown: false,
          tabBarButton: (props) => <LiveTabButton {...props} />,
          tabBarLabel: () => null,
        }} 
      />
      
      <Tab.Screen 
        name="Reels" 
        component={ReelScreen} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Reels',
        }} 
      />
      
      <Tab.Screen 
        name="Mon compte" 
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Mon compte',
        }}
      />
    </Tab.Navigator>
  );
}
