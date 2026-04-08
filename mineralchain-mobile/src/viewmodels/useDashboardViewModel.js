import { useEffect, useState } from 'react';
import { fetchHealthStatus } from '../services/api/healthService';
import { fetchLots } from '../services/api/lotsService';
import { filterLotsForRole } from '../models/roleAccess';
import {
  approveAdminUser,
  fetchAdminUsers,
  rejectAdminUser,
  revokeAdminUser,
} from '../services/api/authAdminService';

export function useDashboardViewModel(session) {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [lots, setLots] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutatingUsers, setIsMutatingUsers] = useState(false);
  const [error, setError] = useState('');

  const load = async (mode = 'initial') => {
    try {
      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError('');
      const requests = [
        fetchHealthStatus(),
        fetchLots(),
      ];

      if (session?.role === 'admin') {
        requests.push(fetchAdminUsers());
      }

      const [nextHealth, nextLots, nextUsers = []] = await Promise.all(requests);

      setHealth(nextHealth);
      setLots(filterLotsForRole(nextLots, session));
      setUsers(nextUsers);
    } catch (loadError) {
      setError(loadError.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const mutateUsers = async (callback) => {
    try {
      setIsMutatingUsers(true);
      setError('');
      await callback();
      await load('refresh');
    } catch (mutationError) {
      setError(mutationError.message || 'Action admin impossible');
    } finally {
      setIsMutatingUsers(false);
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
    users,
    isLoading,
    isRefreshing,
    isMutatingUsers,
    error,
    refresh: () => load('refresh'),
    approveUser: (userId) => mutateUsers(() => approveAdminUser(userId)),
    rejectUser: (userId, reason) => mutateUsers(() => rejectAdminUser(userId, reason)),
    revokeUser: (userId) => mutateUsers(() => revokeAdminUser(userId)),
  };
}
