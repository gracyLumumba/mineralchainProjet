import { useEffect, useState } from 'react';
import { fetchHealthStatus } from '../services/api/healthService';
import { fetchLots } from '../services/api/lotsService';
import { filterLotsForRole } from '../models/roleAccess';

export function useDashboardViewModel(session) {
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
      setLots(filterLotsForRole(nextLots, session));
    } catch (loadError) {
      setError(loadError.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [session?.id, session?.role, session?.username]);

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
