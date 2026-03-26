import { useEffect, useState } from 'react';
import { fetchHealthStatus } from '../services/api/healthService';
import { fetchLots } from '../services/api/lotsService';

export function useDashboardViewModel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [lots, setLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (mode = 'initial') => {
    try {
      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError('');
      const [nextHealth, nextLots] = await Promise.all([
        fetchHealthStatus(),
        fetchLots(),
      ]);

      setHealth(nextHealth);
      setLots(nextLots);
    } catch (loadError) {
      setError(loadError.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    activeTab,
    setActiveTab,
    health,
    lots,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load('refresh'),
  };
}
