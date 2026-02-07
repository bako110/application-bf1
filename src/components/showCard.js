import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';

export default function ShowCard({ show, onPress, showTime = true, compact = false }) {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <Image
          source={{ uri: show.image_url || 'https://via.placeholder.com/120x80' }}
          style={styles.compactImage}
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {show.title}
          </Text>
          {showTime && show.start_time && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.timeText}>{formatTime(show.start_time)}</Text>
            </View>
          )}
          {show.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{show.category}</Text>
            </View>
          )}
        </View>
        {show.is_live && (
          <View style={styles.liveBadgeCompact}>
            <View style={styles.liveIndicator} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: show.image_url || 'https://via.placeholder.com/400x250' }}
        style={styles.image}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.overlay}
      >
        {show.is_live && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={styles.title}>{show.title}</Text>
          
          {show.description && (
            <Text style={styles.description} numberOfLines={2}>
              {show.description}
            </Text>
          )}
          
          <View style={styles.metaContainer}>
            {showTime && show.start_time && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {formatDate(show.start_time)} • {formatTime(show.start_time)}
                </Text>
              </View>
            )}
            
            {show.host && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{show.host}</Text>
              </View>
            )}
            
            {show.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{show.category}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text,
    marginRight: 6,
  },
  liveText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  categoryTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactImage: {
    width: 120,
    height: 80,
  },
  compactContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  liveBadgeCompact: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.error,
    padding: 6,
    borderRadius: 20,
  },
});
