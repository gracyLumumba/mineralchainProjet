import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

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

function LotRow({ lot, colors }) {
  const isSupect = lot.status === 'SUSPECT';
  const isValidated = lot.regulatorValidated;

  const statusColor = isSupect ? colors.errorText
    : isValidated ? colors.successText
    : colors.accent;

  const statusLabel = isSupect ? 'Bloqué'
    : isValidated ? 'Validé'
    : 'En attente';

  const dotColor = isSupect ? colors.errorText
    : isValidated ? colors.successText
    : colors.accent;

  return (
    <View style={[styles.lotRow, { borderColor: colors.border, backgroundColor: isSupect ? colors.errorBg : 'transparent' }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.lotId, { color: colors.text }]} numberOfLines={1}>{lot.id}</Text>
      <Text style={[styles.lotSite, { color: colors.muted }]}>{lot.site}</Text>
      <Text style={[styles.lotStatus, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );
}

export default function RegulatorDashboardScreen({ lots = [], isRefreshing, refresh }) {
  const { colors } = usePreferences();

  const suspects = lots.filter((l) => l.status === 'SUSPECT');
  const pendingVal = lots.filter((l) => l.analyzedAt && !l.regulatorValidated && l.status !== 'SUSPECT').length;
  const validated = lots.filter((l) => l.regulatorValidated).length;
  const recentActivity = lots.slice(0, 6);

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

      {/* Activité récente */}
      {recentActivity.length > 0 && (
        <AnimatedEntrance delay={130}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Activité récente</Text>
            {recentActivity.map((lot) => (
              <LotRow key={lot.id} lot={lot} colors={colors} />
            ))}
          </View>
        </AnimatedEntrance>
      )}

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
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 2,
    padding: 16,
  },
  panelTitle: { fontSize: 16, fontWeight: '900', marginBottom: 10 },
  lotRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lotId: { flex: 1, fontSize: 13, fontWeight: '700' },
  lotSite: { fontSize: 12 },
  lotStatus: { fontSize: 12, fontWeight: '800' },
  empty: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 32,
  },
  emptyText: { fontSize: 14 },
});
