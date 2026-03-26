import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import ScreenShell from './components/ScreenShell';
import TabBar from './components/TabBar';
import TopBar from './components/TopBar';
import OverviewScreen from './screens/OverviewScreen';
import LotsScreen from './screens/LotsScreen';

export default function AppView() {
  const {
    activeTab,
    setActiveTab,
    health,
    lots,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useDashboardViewModel();

  return (
    <ScreenShell>
      <StatusBar style="dark" />
      <TopBar onRefresh={refresh} isRefreshing={isRefreshing} />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connexion backend echouee</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1d6b57" />
          <Text style={styles.loaderText}>Chargement de MineralChain Mobile...</Text>
        </View>
      ) : activeTab === 'overview' ? (
        <OverviewScreen health={health} lots={lots} />
      ) : (
        <LotsScreen lots={lots} />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  errorTitle: {
    color: '#8f2d14',
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: '#944732',
    fontSize: 14,
    lineHeight: 20,
  },
  loader: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  loaderText: {
    color: '#516160',
    fontSize: 14,
  },
});
