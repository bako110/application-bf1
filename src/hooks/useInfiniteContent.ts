import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const PAGE_SIZE = 20;

type Fetcher = (skip: number, limit: number, category?: string) => Promise<{ items: any[]; total: number }>;

export function useInfiniteContent(queryKey: string[], fetcher: Fetcher, category?: string) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, category],
    queryFn: ({ pageParam = 0 }) => fetcher(pageParam as number, PAGE_SIZE, category),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap(p => p.items) ?? [],
    [query.data],
  );

  const total = query.data?.pages[0]?.total ?? 0;

  return {
    items,
    total,
    isLoading:       query.isLoading,
    isFetchingMore:  query.isFetchingNextPage,
    hasMore:         query.hasNextPage ?? false,
    fetchMore:       query.fetchNextPage,
    refetch:         query.refetch,
  };
}
