import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import StatusCard from '../components/StatusCard';

export default function OverviewScreen({ health, lots, isLoading }) {
  if (isLoading && !health) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#1d6b57" />
        <Text style={styles.placeholderText}>Chargement de l etat backend...</Text>
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
        <Text style={styles.heroLabel}>Etat backend</Text>
        <Text style={styles.heroTitle}>{health.status.toUpperCase()}</Text>
        <Text style={styles.heroText}>
          Base PostgreSQL {health.databaseConnected ? 'connectee' : 'non connectee'} sur {health.databaseUrl}
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
        <StatusCard label="Modeles IA" value={String(health.modelCount)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Fonctionnalites detectees</Text>
        <Text style={styles.panelText}>
          {health.features.length ? health.features.join(', ') : 'Aucune feature remontee'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  hero: {
    backgroundColor: '#17312d',
    borderRadius: 24,
    gap: 8,
    padding: 20,
  },
  heroLabel: {
    color: '#a5d0bc',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroText: {
    color: '#d9ede6',
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  panel: {
    backgroundColor: '#fffaf2',
    borderRadius: 24,
    gap: 10,
    padding: 18,
  },
  panelTitle: {
    color: '#1d2c2b',
    fontSize: 17,
    fontWeight: '800',
  },
  panelText: {
    color: '#516160',
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  placeholderText: {
    color: '#516160',
    fontSize: 15,
  },
});
