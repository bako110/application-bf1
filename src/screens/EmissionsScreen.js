import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import emissionsService from '../services/emissionsService';
import { createEmissionsStyles } from '../styles/emissionsStyles';

export default function EmissionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const styles = createEmissionsStyles(colors);

  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emissions, setEmissions] = useState([]);

  useEffect(() => {
    loadEmissions();
  }, []);

  const loadEmissions = async () => {
    try {
      const data = await emissionsService.getAllEmissions();
      setEmissions(data || []);
    } catch (error) {
      setEmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmissions();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { width: `${100 / numColumns - 3}%` }]}
      onPress={() =>
        navigation.navigate('ShowDetail', { 
          showId: item.id,
          isEmission: true
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
      />

      {item.isNew && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NOUVEAU</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.views !== undefined && item.views !== null && (
          <View style={styles.viewsContainer}>
            <Ionicons name="eye-outline" size={14} color="#fff" />
            <Text style={styles.viewsText}>
              {item.views > 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views.toString()} vues
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#888" />
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={emissions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="tv-outline" size={60} color="#888" />
            <Text style={styles.empty}>Aucune émission disponible</Text>
          </View>
        }
      />
    </View>
  );
}