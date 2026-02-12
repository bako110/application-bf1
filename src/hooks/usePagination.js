import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer la pagination avec scroll infini
 * @param {Function} fetchFunction - Fonction pour récupérer les données (doit accepter skip et limit)
 * @param {number} pageSize - Nombre d'éléments par page (défaut: 20)
 * @returns {Object} - État et fonctions de pagination
 */
export default function usePagination(fetchFunction, pageSize = 20) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);

  // Chargement initial
  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction(0, pageSize);
      const newData = Array.isArray(result) ? result : result.data || [];
      setData(newData);
      setPage(1);
      setHasMore(newData.length >= pageSize);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize]);

  // Rafraîchir (pull to refresh)
  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const result = await fetchFunction(0, pageSize);
      const newData = Array.isArray(result) ? result : result.data || [];
      setData(newData);
      setPage(1);
      setHasMore(newData.length >= pageSize);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFunction, pageSize]);

  // Charger plus (scroll infini)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    try {
      setLoadingMore(true);
      const skip = page * pageSize;
      const result = await fetchFunction(skip, pageSize);
      const newData = Array.isArray(result) ? result : result.data || [];
      
      if (newData.length > 0) {
        setData(prevData => [...prevData, ...newData]);
        setPage(prevPage => prevPage + 1);
        setHasMore(newData.length >= pageSize);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more data:', err);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFunction, pageSize, page, loadingMore, hasMore, loading]);

  return {
    data,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    setData, // Pour permettre des mises à jour manuelles si nécessaire
  };
}
