import { useCallback, useEffect, useState } from 'react';
import { fetchLotDetail } from '../services/api/lotDetailService';

export function useLotDetailViewModel(lotId) {
  const [lot, setLot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (mode = 'initial') => {
      try {
        if (mode === 'initial') {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setError('');
        const nextLot = await fetchLotDetail(lotId);
        setLot(nextLot);
      } catch (loadError) {
        setError(loadError.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [lotId]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    lot,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load('refresh'),
  };
}
