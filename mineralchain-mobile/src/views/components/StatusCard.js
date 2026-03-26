import { StyleSheet, Text, View } from 'react-native';

export default function StatusCard({ label, value, tone = 'default' }) {
  return (
    <View style={[styles.card, tone === 'success' ? styles.successCard : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffaf2',
    borderColor: '#d8ccb4',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minWidth: 150,
    padding: 16,
  },
  successCard: {
    backgroundColor: '#eef8f2',
    borderColor: '#9cc8ae',
  },
  label: {
    color: '#7f6d4f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: '#1d2c2b',
    fontSize: 18,
    fontWeight: '800',
  },
});
