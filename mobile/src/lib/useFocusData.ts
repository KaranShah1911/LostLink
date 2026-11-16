import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from './api';

/**
 * Loads data every time the screen comes into focus (so lists stay up to date
 * after reporting or deleting an item) and supports pull-to-refresh.
 * `fetcher` must be wrapped in useCallback by the caller.
 */
export function useFocusData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasData = useRef(false);
  const latestRequest = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      const requestId = ++latestRequest.current;
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'initial') setLoading(true);
      try {
        const result = await fetcher();
        // Ignore a slow older response (e.g. after quickly switching Browse filters).
        if (requestId !== latestRequest.current) return;
        setData(result);
        hasData.current = true;
        setError(null);
      } catch (err) {
        if (requestId === latestRequest.current) setError(getErrorMessage(err));
      } finally {
        if (requestId === latestRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetcher]
  );

  useFocusEffect(
    useCallback(() => {
      // Show the spinner only the first time; later focuses refresh quietly.
      load(hasData.current ? 'silent' : 'initial');
    }, [load])
  );

  return {
    data,
    setData,
    error,
    loading, // only true while there is no data yet (first load or retry after an error)
    refreshing,
    refresh: () => load('refresh'),
    retry: () => load('initial'),
  };
}
