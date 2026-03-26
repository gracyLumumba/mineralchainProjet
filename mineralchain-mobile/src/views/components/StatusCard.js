import { StyleSheet, Text, View } from 'react-native';

export default function StatusCard({ label, value, tone = 'default' }) {
  return (
    <View style={[styles.card, tone === 'success' ? styles.successCard : null]}>
      <View style={styles.badge} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fcf7ee',
    borderColor: '#dcccb5',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    minWidth: 154,
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#9b815f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  successCard: {
    backgroundColor: '#edf7f0',
    borderColor: '#9dbda9',
  },
  badge: {
    width: 34,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#bf8b4c',
  },
  label: {
    color: '#8b6d47',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    color: '#1b2f2d',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
});
