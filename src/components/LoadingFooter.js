import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant de footer pour indiquer le chargement de plus de données
 */
export default function LoadingFooter({ loading, hasMore }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!loading && !hasMore) {
    return (
      <View style={styles.container}>
        <Text style={styles.endText}>Vous avez tout vu ! 🎉</Text>
      </View>
    );
  }

  if (!loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  endText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
