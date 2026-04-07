import { StyleSheet, Text, View } from 'react-native';

export default function LotCard({ lot }) {
  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <Text style={styles.eyebrow}>Lot</Text>
        <Text style={styles.storage}>{lot.storage}</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.id}>{lot.id}</Text>
        <Text style={styles.status}>{lot.status}</Text>
      </View>
      <View style={styles.metaBlock}>
        <Text style={styles.meta}>Site: {lot.site}</Text>
        <Text style={styles.meta}>Poids: {lot.weight} t</Text>
        <Text style={styles.meta}>
          Blockchain: {lot.tokenId ? `Token ${lot.tokenId} - Bloc ${lot.blockNumber}` : 'En attente'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fcf8ef',
    borderColor: '#dfcfb6',
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
    color: '#8e6a3f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  storage: {
    color: '#5f6b64',
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
    color: '#182e2a',
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.3,
  },
  status: {
    backgroundColor: '#d7eadf',
    borderRadius: 999,
    color: '#245b49',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  metaBlock: {
    gap: 6,
  },
  meta: {
    color: '#55645f',
    fontSize: 14,
    lineHeight: 20,
  },
});
