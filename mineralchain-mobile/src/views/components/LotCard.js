import { StyleSheet, Text, View } from 'react-native';

export default function LotCard({ lot }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>{lot.id}</Text>
        <Text style={styles.status}>{lot.status}</Text>
      </View>
      <Text style={styles.meta}>Site: {lot.site}</Text>
      <Text style={styles.meta}>Poids: {lot.weight} t</Text>
      <Text style={styles.meta}>
        Blockchain: {lot.tokenId ? `Token ${lot.tokenId} / Bloc ${lot.blockNumber}` : 'Non certifie'}
      </Text>
      <Text style={styles.meta}>Stockage: {lot.storage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    gap: 8,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  id: {
    color: '#1d2c2b',
    fontSize: 16,
    fontWeight: '800',
  },
  status: {
    backgroundColor: '#d7eadf',
    borderRadius: 999,
    color: '#245b49',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  meta: {
    color: '#516160',
    fontSize: 14,
  },
});
