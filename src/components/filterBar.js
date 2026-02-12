import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';

export default function FilterBar({ 
  filters, 
  activeFilter, 
  onFilterChange, 
  showIcons = false 
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <TouchableOpacity
            key={filter.value}
            style={[styles.filterButton, isActive && styles.filterButtonActive]}
            onPress={() => onFilterChange(filter.value)}
            activeOpacity={0.7}
          >
            {showIcons && filter.icon && (
              <Ionicons
                name={filter.icon}
                size={18}
                color={isActive ? '#FFFFFF' : '#B0B0B0'}
                style={styles.icon}
              />
            )}
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
              {filter.label}
            </Text>
            {filter.count !== undefined && (
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 60,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A0000',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  icon: {
    marginRight: 6,
  },
  filterText: {
    color: '#B0B0B0',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#330000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
