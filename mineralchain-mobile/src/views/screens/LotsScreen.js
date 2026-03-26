import { StyleSheet, Text, View } from 'react-native';
import LotCard from '../components/LotCard';

export default function LotsScreen({ lots }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lots recents</Text>
      {lots.length ? (
        lots.map((lot) => <LotCard key={lot.id} lot={lot} />)
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun lot disponible pour le moment.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: '#1d2c2b',
    fontSize: 20,
    fontWeight: '800',
  },
  empty: {
    backgroundColor: '#fffaf2',
    borderRadius: 20,
    padding: 18,
  },
  emptyText: {
    color: '#516160',
    fontSize: 14,
  },
});
