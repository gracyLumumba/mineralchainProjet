import { StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function LotCard({ lot }) {
  const { colors } = usePreferences();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.topLine}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>Lot</Text>
        <Text style={[styles.storage, { color: colors.muted }]}>{lot.storage}</Text>
      </View>
      <View style={styles.header}>
        <Text style={[styles.id, { color: colors.text }]}>{lot.id}</Text>
        <View style={[styles.statusPill, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
          <Text style={[styles.status, { color: colors.badgeText }]}>{lot.status}</Text>
        </View>
      </View>
      <View style={styles.metaBlock}>
        <Text style={[styles.meta, { color: colors.muted }]}>Site: {lot.site}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>Poids: {lot.weight} t</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Blockchain: {lot.tokenId ? `Token ${lot.tokenId} - Bloc ${lot.blockNumber}` : 'En attente'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    shadowColor: '#8e7453',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  storage: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  id: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.3,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaBlock: {
    gap: 6,
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
});
