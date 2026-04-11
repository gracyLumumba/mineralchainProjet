import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

function AlertCard({ lot, colors, type }) {
  const isSuspect = type === 'suspect';
  const bg = isSuspect ? colors.errorBg : colors.ghostButton;
  const borderColor = isSuspect ? colors.errorBorder : colors.border;
  const iconColor = isSuspect ? colors.errorText : colors.accent;
  const iconName = isSuspect ? 'block-helper' : 'alert';

  return (
    <View style={[styles.alertCard, { backgroundColor: bg, borderColor }]}>
      <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
      <View style={styles.alertBody}>
        <Text style={[styles.alertId, { color: isSuspect ? colors.errorText : colors.text }]}>
          {lot.id}
        </Text>
        <View style={styles.alertMeta}>
          <Text style={[styles.metaItem, { color: colors.muted }]}>Site: {lot.site}</Text>
          <Text style={[styles.metaItem, { color: colors.muted }]}>
            Confiance: {lot.confidence ? `${(lot.confidence * 100).toFixed(1)}%` : '—'}
          </Text>
          <Text style={[styles.metaItem, { color: colors.muted }]}>Cu: {lot.cuGradePercent ?? '—'}%</Text>
          <Text style={[styles.metaItem, { color: colors.muted }]}>Co: {lot.coGradePercent ?? '—'}%</Text>
        </View>
      </View>
    </View>
  );
}

export default function RegulatorAlertsScreen({ lots = [], isRefreshing, refresh }) {
  const { colors } = usePreferences();

  const suspects = lots.filter((l) => l.status === 'SUSPECT');
  const toVerify = lots.filter((l) => l.status === 'À VÉRIFIER');

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.errorText }]}>DGMR · Alertes</Text>
          <Text style={[styles.title, { color: colors.text }]}>Fraudes & Anomalies</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Lots suspects et nécessitant une vérification approfondie.
          </Text>
        </View>
      </AnimatedEntrance>

      {/* Stats */}
      <AnimatedEntrance delay={60}>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <MaterialCommunityIcons name="block-helper" size={22} color={colors.errorText} />
            <View>
              <Text style={[styles.statValue, { color: colors.errorText }]}>{suspects.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>SUSPECTS</Text>
            </View>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.ghostButton, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="alert" size={22} color={colors.accent} />
            <View>
              <Text style={[styles.statValue, { color: colors.accent }]}>{toVerify.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>À VÉRIFIER</Text>
            </View>
          </View>
        </View>
      </AnimatedEntrance>

      {/* Lots suspects */}
      {suspects.length > 0 && (
        <AnimatedEntrance delay={80}>
          <View style={[styles.section, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="block-helper" size={16} color={colors.errorText} />
              <Text style={[styles.sectionTitle, { color: colors.errorText }]}>
                Lots suspects ({suspects.length})
              </Text>
            </View>
            {suspects.map((lot, idx) => (
              <AnimatedEntrance key={lot.id} delay={100 + idx * 20}>
                <AlertCard lot={lot} colors={colors} type="suspect" />
              </AnimatedEntrance>
            ))}
          </View>
        </AnimatedEntrance>
      )}

      {/* Lots à vérifier */}
      {toVerify.length > 0 && (
        <AnimatedEntrance delay={suspects.length > 0 ? 120 : 80}>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert" size={16} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                À vérifier ({toVerify.length})
              </Text>
            </View>
            {toVerify.map((lot, idx) => (
              <AnimatedEntrance key={lot.id} delay={140 + idx * 20}>
                <AlertCard lot={lot} colors={colors} type="verify" />
              </AnimatedEntrance>
            ))}
          </View>
        </AnimatedEntrance>
      )}

      {suspects.length === 0 && toVerify.length === 0 && (
        <AnimatedEntrance delay={80}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="check-circle" size={32} color={colors.successText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune alerte</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Tous les lots sont conformes
            </Text>
          </View>
        </AnimatedEntrance>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  section: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  alertBody: { flex: 1, gap: 6 },
  alertId: { fontSize: 14, fontWeight: '900' },
  alertMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: { fontSize: 12 },
  empty: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
