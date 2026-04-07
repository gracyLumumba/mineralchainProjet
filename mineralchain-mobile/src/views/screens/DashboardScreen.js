import { Pressable, StyleSheet, Text, View } from 'react-native';
import OverviewScreen from './OverviewScreen';
import ScreenShell from '../components/ScreenShell';
import TopBar from '../components/TopBar';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

function getRolePresentation(role, t) {
  switch (role) {
    case 'admin':
      return {
        roleLabel: t('role_admin'),
        caption: t('dashboard_role_admin'),
        primaryLabel: t('supervision_center'),
        primaryText: t('dashboard_primary_admin'),
        secondaryLabel: t('lots'),
        secondaryText: t('dashboard_secondary_admin'),
      };
    case 'regulator':
      return {
        roleLabel: t('role_regulator'),
        caption: t('dashboard_role_regulator'),
        primaryLabel: t('tracking'),
        primaryText: t('dashboard_primary_regulator'),
        secondaryLabel: t('summary'),
        secondaryText: t('dashboard_secondary_regulator'),
      };
    case 'transporter':
      return {
        roleLabel: t('role_transporter'),
        caption: t('dashboard_role_transporter'),
        primaryLabel: t('tracking'),
        primaryText: t('dashboard_primary_transporter'),
        secondaryLabel: t('summary'),
        secondaryText: t('dashboard_secondary_transporter'),
      };
    default:
      return {
        roleLabel: t('role_producer'),
        caption: t('dashboard_role_producer'),
        primaryLabel: t('issuance'),
        primaryText: t('dashboard_primary_producer'),
        secondaryLabel: t('tracking'),
        secondaryText: t('dashboard_secondary_producer'),
      };
  }
}

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
  const rolePresentation = getRolePresentation(session.role, t);
  const canCertify = session.role === 'producer';

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
              <Text style={[styles.userMeta, { color: colors.muted }]}>{session.site} - {rolePresentation.roleLabel}</Text>
            </View>
          </View>
          <Text style={[styles.userCaption, { color: colors.muted }]}>{rolePresentation.caption}</Text>
        </View>
      </AnimatedEntrance>

      {error ? (
        <AnimatedEntrance delay={110}>
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <Text style={[styles.errorTitle, { color: colors.errorText }]}>{t('connection_unavailable')}</Text>
            <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: colors.muted }]}>{t('dashboard_connection_hint')}</Text>
            <Pressable onPress={refresh} style={[styles.retryButton, { backgroundColor: colors.ghostButton }]}>
              <Text style={[styles.retryText, { color: colors.ghostButtonText }]}>{t('retry')}</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance delay={140}>
        <OverviewScreen health={health} lots={lots} isLoading={isLoading} />
      </AnimatedEntrance>

      <AnimatedEntrance delay={190}>
        <View style={styles.actions}>
          <Pressable
            onPress={canCertify ? onOpenCertification : onOpenLots}
            style={[styles.secondaryButton, { backgroundColor: colors.brand, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.secondaryLabel, { color: colors.surfaceStrongText }]}>{rolePresentation.primaryLabel}</Text>
            <Text style={styles.secondaryText}>{rolePresentation.primaryText}</Text>
          </Pressable>
          <Pressable onPress={onOpenLots} style={[styles.actionButton, { backgroundColor: colors.surfaceStrong, shadowColor: colors.shadow }]}>
            <Text style={[styles.actionLabel, { color: colors.accent }]}>{rolePresentation.secondaryLabel}</Text>
            <Text style={styles.actionText}>{rolePresentation.secondaryText}</Text>
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
  errorHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
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
