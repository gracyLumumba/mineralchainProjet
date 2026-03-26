import { useEffect, useState } from 'react';
import { fetchLotDetail } from '../services/api/lotDetailService';

export function useLotDetailViewModel(lotId) {
  const [lot, setLot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError('');
        const nextLot = await fetchLotDetail(lotId);
        if (isMounted) {
          setLot(nextLot);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Erreur de chargement');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [lotId]);

  return {
    lot,
    isLoading,
    error,
  };
}
