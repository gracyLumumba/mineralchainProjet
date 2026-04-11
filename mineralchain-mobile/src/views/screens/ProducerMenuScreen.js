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

export default function ProducerMenuScreen({ lots = [], isRefreshing, refresh, onNavigate }) {
  const { colors } = usePreferences();

  const totalLots = lots.length;
  const certified = lots.filter((l) => l.tokenId != null).length;
  const suspects = lots.filter((l) => l.status === 'SUSPECT').length;
  const pendingVal = lots.filter((l) => l.analyzedAt && !l.regulatorValidated && l.status !== 'SUSPECT').length;

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Production · Kamoa</Text>
          <Text style={[styles.title, { color: colors.text }]}>Menu producteur</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Soumission, certification et suivi on-chain des lots.</Text>
        </View>
      </AnimatedEntrance>

      {/* Alerte en attente DGMR */}
      {pendingVal > 0 && (
        <AnimatedEntrance delay={60}>
          <View style={[styles.alertBox, { backgroundColor: colors.ghostButton, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.accent} />
            <Text style={[styles.alertText, { color: colors.accent }]}>
              {pendingVal} lot{pendingVal > 1 ? 's' : ''} en attente de validation DGMR
            </Text>
          </View>
        </AnimatedEntrance>
      )}

      {/* Stats */}
      <AnimatedEntrance delay={80}>
        <View style={styles.statsGrid}>
          <StatCard label="Total lots"    value={totalLots}  icon="layers"        tone="default"  colors={colors} />
          <StatCard label="Certifiés"     value={certified}  icon="certificate"   tone="success"  colors={colors} />
          <StatCard label="Suspects"      value={suspects}   icon="alert-circle"  tone="danger"   colors={colors} />
          <StatCard label="Attente DGMR"  value={pendingVal} icon="clock-outline" tone="warning"  colors={colors} />
        </View>
      </AnimatedEntrance>

      {/* Menu navigation */}
      <AnimatedEntrance delay={110}>
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          <MenuCard
            icon="chart-box"
            title="Dashboard"
            subtitle="Vue d'ensemble et statistiques"
            color={colors.brand}
            onPress={() => onNavigate(ROUTES.PRODUCER)}
            colors={colors}
          />
          <MenuCard
            icon="plus-circle"
            title="Certifier un lot"
            subtitle="Soumettre un nouveau lot"
            color={colors.successText}
            onPress={() => onNavigate(ROUTES.CERTIFY)}
            colors={colors}
          />
          <MenuCard
            icon="format-list-bulleted"
            title="Mes lots"
            subtitle={`${totalLots} lot${totalLots > 1 ? 's' : ''} au total`}
            color={colors.text}
            onPress={() => onNavigate(ROUTES.LOTS)}
            colors={colors}
          />
        </View>
      </AnimatedEntrance>

      {lots.length === 0 && (
        <AnimatedEntrance delay={130}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="pickaxe" size={32} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun lot</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Soumettez votre premier lot pour démarrer.</Text>
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
