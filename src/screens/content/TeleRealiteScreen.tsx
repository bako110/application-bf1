import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PageScreen } from '../../components/layout/PageScreen';
import { ContentCard } from '../../components/ui/ContentCard';
import { useTranslation } from '../../hooks/useTranslation';
import { useInfiniteContent } from '../../hooks/useInfiniteContent';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuthStore } from '../../stores';
import { GRID_CARD_W } from '../../constants';
import * as api from '../../services/api';
import type { HomeStackParams } from '../../navigation/types';

type Nav = StackNavigationProp<HomeStackParams>;

export function TeleRealiteScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { canAccess } = useAuthStore();
  const { isFav, toggleFav } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const { items, isLoading, isFetchingMore, fetchMore, refetch } =
    useInfiniteContent(['tele-realite-page'], api.getTeleRealite);

  return (
    <PageScreen
      title={t.content.tele_realite}
      onBack={() => navigation.goBack()}
      isLoading={isLoading}
      isEmpty={!items.length && !isLoading}
      data={items}
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
      onEndReached={() => fetchMore()}
      isFetchingMore={isFetchingMore}
      renderItem={({ item }) => (
        <ContentCard
          title={item.title}
          image={item.thumbnail ?? item.image_url ?? item.image}
          duration={item.duration_minutes ?? item.duration}
          date={item.created_at}
          subscription={item.subscription}
          isLocked={!canAccess(item.subscription)}
          isFavorited={isFav(item.id)}
          onToggleFav={() => toggleFav(item.id, 'tele_realite')}
          onPress={() => navigation.navigate('ShowDetail', { id: item.id, type: 'tele_realite' })}
          style={{ width: GRID_CARD_W }}
        />
      )}
    />
  );
}
