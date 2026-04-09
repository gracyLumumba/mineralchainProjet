import { Pressable, StyleSheet, Text, View } from 'react-native';
import OverviewScreen from './OverviewScreen';
import ScreenShell from '../components/ScreenShell';
import TopBar from '../components/TopBar';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { buildRoleSummary } from '../../models/roleInsights';
import { GANACHE_NETWORK_LABEL } from '../../config/blockchain';

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

function getToneColors(colors, tone) {
  if (tone === 'success') {
    return { bg: colors.successBg, text: colors.successText, border: colors.successBorder };
  }
  if (tone === 'warning') {
    return { bg: colors.ghostButton, text: colors.accent, border: colors.border };
  }
  if (tone === 'danger') {
    return { bg: colors.errorBg, text: colors.errorText, border: colors.errorBorder };
  }
  return { bg: colors.cardAlt, text: colors.text, border: colors.border };
}

export default function DashboardScreen({
  session,
  health,
  lots,
  users,
  isLoading,
  isRefreshing,
  isMutatingUsers,
  error,
  refresh,
  onApproveUser,
  onRejectUser,
  onRevokeUser,
  onLogout,
  onOpenLots,
  onOpenCertification,
}) {
  const { colors, t } = usePreferences();
  const rolePresentation = getRolePresentation(session.role, t);
  const canCertify = session.role === 'producer';
  const summary = buildRoleSummary(session, lots, users);

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
          <View style={[styles.networkPill, { backgroundColor: colors.surfaceStrong }]}>
            <Text style={[styles.networkLabel, { color: colors.accent }]}>Blockchain</Text>
            <Text style={styles.networkValue}>{GANACHE_NETWORK_LABEL}</Text>
          </View>
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

      <AnimatedEntrance delay={130}>
        <View style={styles.summaryGrid}>
          {summary.cards.map((card) => {
            const tone = getToneColors(colors, card.tone);
            return (
              <View key={card.key} style={[styles.summaryCard, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>{card.label}</Text>
                <Text style={[styles.summaryValue, { color: tone.text }]}>{card.value}</Text>
              </View>
            );
          })}
        </View>
      </AnimatedEntrance>

      {session.role === 'admin' && summary.spotlight?.length ? (
        <AnimatedEntrance delay={160}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>{summary.spotlightTitle}</Text>
              {isMutatingUsers ? <Text style={[styles.panelMeta, { color: colors.muted }]}>Mise a jour...</Text> : null}
            </View>
            {summary.spotlight.map((user) => (
              <View key={user.id} style={[styles.userRow, { borderColor: colors.border }]}>
                <View style={styles.userRowCopy}>
                  <Text style={[styles.userRowTitle, { color: colors.text }]}>{user.name}</Text>
                  <Text style={[styles.userRowMeta, { color: colors.muted }]}>{user.role} - {user.organization}</Text>
                </View>
                <View style={styles.userRowActions}>
                  <Pressable
                    disabled={isMutatingUsers}
                    onPress={() => onApproveUser?.(user.id)}
                    style={[styles.smallButton, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}
                  >
                    <Text style={[styles.smallButtonText, { color: colors.successText }]}>Approuver</Text>
                  </Pressable>
                  <Pressable
                    disabled={isMutatingUsers}
                    onPress={() => onRejectUser?.(user.id, 'Refuse depuis mobile admin')}
                    style={[styles.smallButton, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
                  >
                    <Text style={[styles.smallButtonText, { color: colors.errorText }]}>Refuser</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance delay={190}>
        <OverviewScreen health={health} lots={lots} isLoading={isLoading} session={session} />
      </AnimatedEntrance>

      <AnimatedEntrance delay={230}>
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
          {session.role === 'admin' ? (
            <View style={[styles.ghostAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.ghostActionLabel, { color: colors.text }]}>Admin mobile</Text>
              <Text style={[styles.ghostActionText, { color: colors.muted }]}>
                {summary.spotlight?.length ? 'Traiter rapidement les demandes en attente depuis ce tableau de bord.' : 'Aucun compte en attente actuellement.'}
              </Text>
            </View>
          ) : null}
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
  networkPill: {
    borderRadius: 18,
    gap: 4,
    padding: 12,
  },
  networkLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  networkValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    minWidth: '47%',
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  panelMeta: {
    fontSize: 12,
  },
  userRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  userRowCopy: {
    flex: 1,
    gap: 2,
  },
  userRowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  userRowMeta: {
    fontSize: 12,
  },
  userRowActions: {
    gap: 8,
    justifyContent: 'center',
  },
  smallButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallButtonText: {
    fontSize: 11,
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
  ghostAction: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  ghostActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ghostActionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
