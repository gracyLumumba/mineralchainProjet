import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

function LotRow({ lot, colors }) {
  const isSupect = lot.status === 'SUSPECT';
  const isValidated = lot.regulatorValidated;

  const statusColor = isSupect ? colors.errorText
    : lot.status === 'AUTHENTIQUE' ? colors.successText
    : colors.accent;

  const statusLabel = lot.status;

  const dotColor = isSupect ? colors.errorText
    : lot.status === 'AUTHENTIQUE' ? colors.successText
    : colors.accent;

  return (
    <View style={[styles.lotRow, { borderColor: colors.border, backgroundColor: isSupect ? colors.errorBg : 'transparent' }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.lotMain}>
        <Text style={[styles.lotId, { color: colors.text }]} numberOfLines={1}>{lot.id}</Text>
        <View style={styles.lotMeta}>
          <Text style={[styles.metaItem, { color: colors.muted }]}>{lot.site}</Text>
          <Text style={[styles.metaItem, { color: colors.muted }]}>Cu: {lot.cuGradePercent ?? '—'}%</Text>
          <Text style={[styles.metaItem, { color: colors.muted }]}>Co: {lot.coGradePercent ?? '—'}%</Text>
        </View>
      </View>
      <View style={styles.lotRight}>
        <Text style={[styles.statusBadge, { color: statusColor }]}>{statusLabel}</Text>
        {isValidated && (
          <MaterialCommunityIcons name="check-decagram" size={14} color={colors.successText} />
        )}
      </View>
    </View>
  );
}

export default function RegulatorLotsScreen({ lots = [], isRefreshing, refresh }) {
  const { colors } = usePreferences();

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>DGMR · Tous les lots</Text>
          <Text style={[styles.title, { color: colors.text }]}>Supervision complète</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {lots.length} lot{lots.length > 1 ? 's' : ''} au total
          </Text>
        </View>
      </AnimatedEntrance>

      {lots.length > 0 ? (
        <AnimatedEntrance delay={60}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {lots.map((lot, idx) => (
              <AnimatedEntrance key={lot.id} delay={80 + idx * 10}>
                <LotRow lot={lot} colors={colors} />
              </AnimatedEntrance>
            ))}
          </View>
        </AnimatedEntrance>
      ) : (
        <AnimatedEntrance delay={60}>
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
  header: { gap: 4, marginBottom: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  lotRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lotMain: { flex: 1, gap: 4 },
  lotId: { fontSize: 13, fontWeight: '700' },
  lotMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: { fontSize: 11 },
  lotRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  empty: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 40,
  },
  emptyText: { fontSize: 14 },
});
