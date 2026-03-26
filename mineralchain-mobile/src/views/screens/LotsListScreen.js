import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import LotCard from '../components/LotCard';

export default function LotsListScreen({ lots, onOpenLot }) {
  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.title}>Lots</Text>
        <Text style={styles.subtitle}>Consulter le detail d un lot.</Text>
      </View>

      {lots.length ? (
        lots.map((lot) => (
          <Pressable key={lot.id} onPress={() => onOpenLot(lot.id)}>
            <LotCard lot={lot} />
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun lot disponible pour le moment.</Text>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    color: '#1d2c2b',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#5f675c',
    fontSize: 14,
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
