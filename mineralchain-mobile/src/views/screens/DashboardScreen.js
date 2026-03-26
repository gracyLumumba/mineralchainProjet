import { Pressable, StyleSheet, Text, View } from 'react-native';
import OverviewScreen from './OverviewScreen';
import ScreenShell from '../components/ScreenShell';
import TopBar from '../components/TopBar';

export default function DashboardScreen({
  session,
  health,
  lots,
  isLoading,
  isRefreshing,
  error,
  refresh,
  onOpenLots,
  onOpenCertification,
}) {
  return (
    <ScreenShell>
      <TopBar onRefresh={refresh} isRefreshing={isRefreshing} />

      <View style={styles.userCard}>
        <Text style={styles.userTitle}>{session.name}</Text>
        <Text style={styles.userMeta}>
          {session.site} - {session.role}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connexion indisponible</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <OverviewScreen health={health} lots={lots} isLoading={isLoading} />

      <View style={styles.actions}>
        <Pressable onPress={onOpenLots} style={styles.actionButton}>
          <Text style={styles.actionText}>Voir les lots</Text>
        </Pressable>
        <Pressable onPress={onOpenCertification} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Certifier un lot</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#e9dfcf',
    borderRadius: 22,
    gap: 4,
    padding: 16,
  },
  userTitle: {
    color: '#1d2c2b',
    fontSize: 20,
    fontWeight: '800',
  },
  userMeta: {
    color: '#5f675c',
    fontSize: 14,
  },
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
  actions: {
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#1d2c2b',
    borderRadius: 18,
    paddingVertical: 14,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#e0d3be',
    borderRadius: 18,
    paddingVertical: 14,
  },
  secondaryText: {
    color: '#17312d',
    fontSize: 15,
    fontWeight: '800',
  },
});
