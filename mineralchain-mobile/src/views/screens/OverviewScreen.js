import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import StatusCard from '../components/StatusCard';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function OverviewScreen({ health, lots, isLoading }) {
  const { colors, t } = usePreferences();

  if (isLoading && !health) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={[styles.placeholderText, { color: colors.muted }]}>Chargement...</Text>
      </View>
    );
  }

  if (!health) {
    return null;
  }

  const certifiedLots = lots.filter((lot) => lot.tokenId).length;

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: colors.surfaceStrong, shadowColor: colors.shadow }]}>
        <Text style={[styles.heroLabel, { color: colors.accent }]}>{t('supervision_center')}</Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>{health.status.toUpperCase()}</Text>
        <Text style={[styles.heroText, { color: colors.surfaceStrongText }]}>
          PostgreSQL {health.databaseConnected ? 'connectee' : 'indisponible'} - {health.databaseUrl}
        </Text>
      </View>

      <View style={styles.grid}>
        <StatusCard
          label="Base"
          value={health.databaseEnabled ? 'Activee' : 'Inactive'}
          tone={health.databaseConnected ? 'success' : 'default'}
        />
        <StatusCard label="Lots" value={String(lots.length)} />
        <StatusCard label="Certifies" value={String(certifiedLots)} />
        <StatusCard label="Modeles" value={String(health.modelCount)} />
      </View>

      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.panelEyebrow, { color: colors.accent }]}>{t('summary')}</Text>
        <Text style={[styles.panelTitle, { color: colors.text }]}>{t('active_indicators')}</Text>
        <Text style={[styles.panelText, { color: colors.muted }]}>
          {health.features.length ? health.features.join(', ') : 'Aucune donnee disponible'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  hero: {
    borderRadius: 30,
    gap: 8,
    padding: 22,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 5,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  panelEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  panelText: {
    fontSize: 14,
    lineHeight: 21,
  },
  placeholder: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  placeholderText: {
    fontSize: 15,
  },
});
