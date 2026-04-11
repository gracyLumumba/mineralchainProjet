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

function StatCard({ label, value, tone, colors }) {
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
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function RegulatorScreen({ lots = [], isRefreshing, refresh, onNavigate }) {
  const { colors } = usePreferences();

  const suspects = lots.filter((l) => l.status === 'SUSPECT');
  const toVerify = lots.filter((l) => l.status === 'À VÉRIFIER');
  const pendingVal = lots.filter((l) => l.analyzedAt && !l.regulatorValidated && l.status !== 'SUSPECT').length;
  const validated = lots.filter((l) => l.regulatorValidated).length;

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>DGMR · Contrôle</Text>
          <Text style={[styles.title, { color: colors.text }]}>Supervision</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Contrôle et vérification des données de certification.</Text>
        </View>
      </AnimatedEntrance>

      {/* Alerte en attente de validation */}
      {pendingVal > 0 && (
        <AnimatedEntrance delay={60}>
          <View style={[styles.alertBox, { backgroundColor: colors.ghostButton, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.accent} />
            <View style={styles.alertBody}>
              <Text style={[styles.alertTitle, { color: colors.accent }]}>
                {pendingVal} lot{pendingVal > 1 ? 's' : ''} en attente de validation
              </Text>
              <Text style={[styles.alertSub, { color: colors.muted }]}>Transport bloqué jusqu'à validation DGMR</Text>
            </View>
          </View>
        </AnimatedEntrance>
      )}

      {/* Alerte suspects */}
      {suspects.length > 0 && (
        <AnimatedEntrance delay={80}>
          <View style={[styles.alertBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={colors.errorText} />
            <View style={styles.alertBody}>
              <Text style={[styles.alertTitle, { color: colors.errorText }]}>
                {suspects.length} lot{suspects.length > 1 ? 's' : ''} SUSPECT{suspects.length > 1 ? 'S' : ''}
              </Text>
              <Text style={[styles.alertSub, { color: colors.muted }]} numberOfLines={1}>
                {suspects.map((s) => s.id).join(' · ')}
              </Text>
            </View>
          </View>
        </AnimatedEntrance>
      )}

      {/* Stats cards */}
      <AnimatedEntrance delay={100}>
        <View style={styles.statsGrid}>
          <StatCard label="À valider"     value={pendingVal}  tone="warning" colors={colors} />
          <StatCard label="Suspects"      value={suspects.length} tone="danger" colors={colors} />
          <StatCard label="Validés DGMR"  value={validated}   tone="success" colors={colors} />
          <StatCard label="Total lots"    value={lots.length} tone="default" colors={colors} />
        </View>
      </AnimatedEntrance>

      {/* Menu navigation */}
      <AnimatedEntrance delay={130}>
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          <MenuCard
            icon="chart-box"
            title="Dashboard"
            subtitle="Vue d'ensemble et activité"
            color={colors.brand}
            onPress={() => onNavigate(ROUTES.REGULATOR_DASHBOARD)}
            colors={colors}
          />
          <MenuCard
            icon="check-decagram"
            title="Analyse automatique"
            subtitle={`${pendingVal} lot${pendingVal > 1 ? 's' : ''} en attente`}
            color={colors.accent}
            onPress={() => onNavigate(ROUTES.REGULATOR_ANALYSIS)}
            colors={colors}
          />
          <MenuCard
            icon="alert-circle"
            title="Alertes"
            subtitle={`${suspects.length + toVerify.length} alerte${suspects.length + toVerify.length > 1 ? 's' : ''}`}
            color={colors.errorText}
            onPress={() => onNavigate(ROUTES.REGULATOR_ALERTS)}
            colors={colors}
          />
          <MenuCard
            icon="format-list-bulleted"
            title="Tous les lots"
            subtitle={`${lots.length} lot${lots.length > 1 ? 's' : ''} au total`}
            color={colors.text}
            onPress={() => onNavigate(ROUTES.REGULATOR_LOTS)}
            colors={colors}
          />
        </View>
      </AnimatedEntrance>

      {lots.length === 0 && (
        <AnimatedEntrance delay={100}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="scale-balance" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun lot disponible</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  alertBody: { flex: 1, gap: 2 },
  alertTitle: { fontSize: 13, fontWeight: '800' },
  alertSub: { fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    flex: 1,
    padding: 16,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
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
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 32,
  },
  emptyText: { fontSize: 14 },
});
