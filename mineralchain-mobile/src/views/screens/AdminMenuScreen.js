import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { ROUTES } from '../../navigation/routes';

function MenuCard({ icon, title, subtitle, color, onPress, colors }) {
  return (
    <Pressable onPress={onPress} style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

function StatCard({ label, value, icon, tone, colors }) {
  const bg = tone === 'danger' ? colors.errorBg
    : tone === 'warning' ? colors.ghostButton
    : tone === 'success' ? colors.successBg
    : colors.cardAlt;
  const textColor = tone === 'danger' ? colors.errorText
    : tone === 'warning' ? colors.accent
    : tone === 'success' ? colors.successText
    : colors.text;
  const border = tone === 'danger' ? colors.errorBorder
    : tone === 'warning' ? colors.border
    : tone === 'success' ? colors.successBorder
    : colors.border;

  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <MaterialCommunityIcons name={icon} size={20} color={textColor} />
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function AdminMenuScreen({ lots = [], users = [], isRefreshing, refresh, onNavigate }) {
  const { colors } = usePreferences();

  const totalLots = lots.length;
  const certified = lots.filter((l) => l.tokenId != null).length;
  const suspects = lots.filter((l) => l.status === 'SUSPECT').length;
  const pendingUsers = users.filter((u) => u.account_status === 'pending').length;

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Administration · Système</Text>
          <Text style={[styles.title, { color: colors.text }]}>Menu administrateur</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Supervision globale et gestion des utilisateurs.</Text>
        </View>
      </AnimatedEntrance>

      {/* Alerte utilisateurs en attente */}
      {pendingUsers > 0 && (
        <AnimatedEntrance delay={60}>
          <View style={[styles.alertBox, { backgroundColor: colors.ghostButton, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="account-clock" size={18} color={colors.accent} />
            <Text style={[styles.alertText, { color: colors.accent }]}>
              {pendingUsers} utilisateur{pendingUsers > 1 ? 's' : ''} en attente d'approbation
            </Text>
          </View>
        </AnimatedEntrance>
      )}

      {/* Stats */}
      <AnimatedEntrance delay={80}>
        <View style={styles.statsGrid}>
          <StatCard label="Total lots"    value={totalLots}    icon="layers"          tone="default"  colors={colors} />
          <StatCard label="Certifiés"     value={certified}    icon="certificate"     tone="success"  colors={colors} />
          <StatCard label="Suspects"      value={suspects}     icon="alert-circle"    tone="danger"   colors={colors} />
          <StatCard label="En attente"    value={pendingUsers} icon="account-clock"   tone="warning"  colors={colors} />
        </View>
      </AnimatedEntrance>

      {/* Menu navigation */}
      <AnimatedEntrance delay={110}>
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          <MenuCard
            icon="shield-account"
            title="Gestion utilisateurs"
            subtitle={`${pendingUsers} demande${pendingUsers > 1 ? 's' : ''} en attente`}
            color={colors.accent}
            onPress={() => onNavigate(ROUTES.DASHBOARD)}
            colors={colors}
          />
          <MenuCard
            icon="chart-box"
            title="Vue d'ensemble"
            subtitle="Statistiques et activité globale"
            color={colors.brand}
            onPress={() => onNavigate(ROUTES.DASHBOARD)}
            colors={colors}
          />
          <MenuCard
            icon="format-list-bulleted"
            title="Tous les lots"
            subtitle={`${totalLots} lot${totalLots > 1 ? 's' : ''} au total`}
            color={colors.text}
            onPress={() => onNavigate(ROUTES.LOTS)}
            colors={colors}
          />
          <MenuCard
            icon="alert-circle"
            title="Alertes"
            subtitle={`${suspects} lot${suspects > 1 ? 's' : ''} suspect${suspects > 1 ? 's' : ''}`}
            color={colors.errorText}
            onPress={() => onNavigate(ROUTES.LOTS)}
            colors={colors}
          />
          <MenuCard
            icon="swap-horizontal"
            title="Transactions"
            subtitle="Historique blockchain recents"
            color={colors.brand}
            onPress={() => onNavigate(ROUTES.TRANSACTIONS)}
            colors={colors}
          />
        </View>
      </AnimatedEntrance>

      {lots.length === 0 && (
        <AnimatedEntrance delay={130}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="shield-account" size={32} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun lot</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Le système est prêt à recevoir des lots.</Text>
          </View>
        </AnimatedEntrance>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  alertBox: {
    borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  alertText: { fontSize: 13, fontWeight: '700', flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    borderRadius: 20, borderWidth: 1, gap: 4,
    minWidth: '47%', flex: 1, padding: 14, alignItems: 'flex-start',
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  menuSection: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  menuCard: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 15, fontWeight: '800' },
  menuSubtitle: { fontSize: 12 },
  empty: {
    alignItems: 'center', borderRadius: 22, borderWidth: 1, gap: 8, padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
