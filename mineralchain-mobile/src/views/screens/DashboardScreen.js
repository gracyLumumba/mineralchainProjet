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
  onLogout,
  onOpenLots,
  onOpenCertification,
}) {
  return (
    <ScreenShell>
      <TopBar onRefresh={refresh} onLogout={onLogout} isRefreshing={isRefreshing} />

      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>{(session.name || 'O').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.userCopy}>
            <Text style={styles.userTitle}>{session.name}</Text>
            <Text style={styles.userMeta}>{session.site} · {session.role}</Text>
          </View>
        </View>
        <Text style={styles.userCaption}>Operations terrain, certification et suivi on-chain.</Text>
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
          <Text style={styles.actionLabel}>Suivi</Text>
          <Text style={styles.actionText}>Voir les lots</Text>
        </Pressable>
        <Pressable onPress={onOpenCertification} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>Emission</Text>
          <Text style={styles.secondaryText}>Certifier un lot</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: '#f8f1e5',
    borderColor: '#dbc8a9',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    shadowColor: '#8c7454',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  userHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  userBadge: {
    alignItems: 'center',
    backgroundColor: '#1c5f53',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  userBadgeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  userCopy: {
    flex: 1,
    gap: 2,
  },
  userTitle: {
    color: '#1d2c2b',
    fontSize: 21,
    fontWeight: '900',
  },
  userMeta: {
    color: '#6d654f',
    fontSize: 14,
  },
  userCaption: {
    color: '#4f5f5b',
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 22,
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
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#1b2f2d',
    borderRadius: 24,
    gap: 3,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#1b2f2d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  actionLabel: {
    color: '#ccb58c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: '#b9814c',
    borderRadius: 24,
    gap: 3,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#b9814c',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  secondaryLabel: {
    color: '#f3e4d1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
});
