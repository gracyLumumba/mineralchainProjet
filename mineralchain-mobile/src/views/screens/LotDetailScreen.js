import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useLotDetailViewModel } from '../../viewmodels/useLotDetailViewModel';

export default function LotDetailScreen({ route }) {
  const { lotId } = route.params;
  const { lot, isLoading, error } = useLotDetailViewModel(lotId);

  return (
    <ScreenShell>
      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#1d6b57" />
          <Text style={styles.stateText}>Chargement du lot...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.id}>{lot.id}</Text>
          <Text style={styles.line}>Statut: {lot.status}</Text>
          <Text style={styles.line}>Site: {lot.site}</Text>
          <Text style={styles.line}>Poids: {lot.weight} t</Text>
          <Text style={styles.line}>
            Token: {lot.tokenId ?? 'non certifie'}
          </Text>
          <Text style={styles.line}>
            Bloc: {lot.blockNumber ?? 'non disponible'}
          </Text>
          <Text style={styles.line}>
            Certificat: {lot.certificateId ?? 'non disponible'}
          </Text>
          <Text style={styles.line}>Stockage: {lot.storage}</Text>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stateBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  stateText: {
    color: '#516160',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  errorTitle: {
    color: '#8f2d14',
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: '#944732',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fffaf2',
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  id: {
    color: '#1d2c2b',
    fontSize: 22,
    fontWeight: '800',
  },
  line: {
    color: '#485856',
    fontSize: 15,
    lineHeight: 22,
  },
});
