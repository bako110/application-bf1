import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useUiStore } from '../stores';
import { useTranslation } from './useTranslation';
import * as api from '../services/api';

export function useFavorites() {
  const { isAuthenticated } = useAuthStore();
  const { showLoginModal } = useUiStore();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  const { data: existingFavs } = useQuery({
    queryKey:  ['my-favorites'],
    queryFn:   () => api.getMyFavorites(),
    enabled:   isAuthenticated,
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (!existingFavs) return;
    const ids = new Set(
      (existingFavs as any[])
        .map((f: any) => String(f.content_id ?? f.id ?? ''))
        .filter(Boolean)
    );
    setFavIds(ids);
  }, [existingFavs]);

  const favMutation = useMutation({
    mutationFn: ({ id, isFav, type }: { id: string; isFav: boolean; type: string }) =>
      isFav ? api.removeFavorite(type, id) : api.addFavorite(type, id),
    onSuccess: (_, { id, isFav }) => {
      setFavIds(prev => {
        const next = new Set(prev);
        isFav ? next.delete(id) : next.add(id);
        return next;
      });
      qc.invalidateQueries({ queryKey: ['my-favorites'] });
    },
  });

  const toggleFav = useCallback((id: string | number, type: string) => {
    if (!isAuthenticated) {
      showLoginModal(t.favorites.loginRequired);
      return;
    }
    const sid = String(id);
    favMutation.mutate({ id: sid, isFav: favIds.has(sid), type });
  }, [isAuthenticated, showLoginModal, t, favMutation, favIds]);

  const isFav = useCallback((id: string | number) => favIds.has(String(id)), [favIds]);

  return { isFav, toggleFav };
}
