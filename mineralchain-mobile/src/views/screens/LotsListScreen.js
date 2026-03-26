import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import LotCard from '../components/LotCard';

export default function LotsListScreen({ lots, onOpenLot }) {
  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Inventaire</Text>
        <Text style={styles.title}>Lots</Text>
        <Text style={styles.subtitle}>Consulter le detail d un lot et son statut blockchain.</Text>
      </View>

      {lots.length ? (
        lots.map((lot) => (
          <Pressable key={lot.id} onPress={() => onOpenLot(lot.id)}>
            <LotCard lot={lot} />
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun lot</Text>
          <Text style={styles.emptyText}>Aucune donnee disponible pour le moment.</Text>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  eyebrow: {
    color: '#8e6a3f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    color: '#1d2c2b',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#5f675c',
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    backgroundColor: '#fcf8ef',
    borderColor: '#dfcfb6',
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  emptyTitle: {
    color: '#1d2c2b',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#516160',
    fontSize: 14,
  },
});
