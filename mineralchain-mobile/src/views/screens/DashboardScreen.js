import { Pressable, StyleSheet, Text, View } from 'react-native';
import OverviewScreen from './OverviewScreen';
import ScreenShell from '../components/ScreenShell';
import TopBar from '../components/TopBar';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

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
  const { colors, t } = usePreferences();

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <TopBar onRefresh={refresh} onLogout={onLogout} isRefreshing={isRefreshing} />
      </AnimatedEntrance>

      <AnimatedEntrance delay={70}>
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.userHeader}>
            <View style={[styles.userBadge, { backgroundColor: colors.brand }]}>
              <Text style={styles.userBadgeText}>{(session.name || 'O').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.userCopy}>
              <Text style={[styles.userTitle, { color: colors.text }]}>{session.name}</Text>
              <Text style={[styles.userMeta, { color: colors.muted }]}>{session.site} - {session.role}</Text>
            </View>
          </View>
          <Text style={[styles.userCaption, { color: colors.muted }]}>{t('dashboard_subtitle')}</Text>
        </View>
      </AnimatedEntrance>

      {error ? (
        <AnimatedEntrance delay={110}>
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <Text style={[styles.errorTitle, { color: colors.errorText }]}>{t('connection_unavailable')}</Text>
            <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance delay={140}>
        <OverviewScreen health={health} lots={lots} isLoading={isLoading} />
      </AnimatedEntrance>

      <AnimatedEntrance delay={190}>
        <View style={styles.actions}>
          <Pressable onPress={onOpenLots} style={[styles.actionButton, { backgroundColor: colors.surfaceStrong, shadowColor: colors.shadow }]}>
            <Text style={[styles.actionLabel, { color: colors.accent }]}>{t('tracking')}</Text>
            <Text style={styles.actionText}>{t('view_lots')}</Text>
          </Pressable>
          <Pressable onPress={onOpenCertification} style={[styles.secondaryButton, { backgroundColor: colors.brand, shadowColor: colors.shadow }]}>
            <Text style={[styles.secondaryLabel, { color: colors.surfaceStrongText }]}>{t('issuance')}</Text>
            <Text style={styles.secondaryText}>{t('certify_lot')}</Text>
          </Pressable>
        </View>
      </AnimatedEntrance>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  userCard: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18,
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
    fontSize: 21,
    fontWeight: '900',
  },
  userMeta: {
    fontSize: 14,
  },
  userCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 24,
    gap: 3,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  actionLabel: {
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
    borderRadius: 24,
    gap: 3,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  secondaryLabel: {
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
