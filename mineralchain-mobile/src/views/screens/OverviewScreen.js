import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import StatusCard from '../components/StatusCard';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function OverviewScreen({ health, lots, isLoading }) {
  const { t } = usePreferences();
  if (isLoading && !health) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#1d6b57" />
        <Text style={styles.placeholderText}>Chargement...</Text>
      </View>
    );
  }

  if (!health) {
    return null;
  }

  const certifiedLots = lots.filter((lot) => lot.tokenId).length;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{t('supervision_center')}</Text>
        <Text style={styles.heroTitle}>{health.status.toUpperCase()}</Text>
        <Text style={styles.heroText}>
          PostgreSQL {health.databaseConnected ? 'connectee' : 'indisponible'} · {health.databaseUrl}
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

      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>{t('summary')}</Text>
        <Text style={styles.panelTitle}>{t('active_indicators')}</Text>
        <Text style={styles.panelText}>
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
    backgroundColor: '#183632',
    borderRadius: 30,
    gap: 8,
    padding: 22,
    shadowColor: '#183632',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 5,
  },
  heroLabel: {
    color: '#ccb58c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroText: {
    color: '#d8ebe4',
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panel: {
    backgroundColor: '#fcf8ef',
    borderColor: '#dfcfb6',
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  panelEyebrow: {
    color: '#8e6a3f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  panelTitle: {
    color: '#1d2c2b',
    fontSize: 20,
    fontWeight: '900',
  },
  panelText: {
    color: '#516160',
    fontSize: 14,
    lineHeight: 21,
  },
  placeholder: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  placeholderText: {
    color: '#516160',
    fontSize: 15,
  },
});
