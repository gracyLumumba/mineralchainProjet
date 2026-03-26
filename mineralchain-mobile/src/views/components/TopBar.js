import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TopBar({ onRefresh, isRefreshing }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.kicker}>MineralChain Mobile</Text>
        <Text style={styles.title}>Kamoa-Kansoko</Text>
      </View>
      <Pressable onPress={onRefresh} style={styles.button}>
        <Text style={styles.buttonText}>
          {isRefreshing ? 'Actualisation...' : 'Rafraichir'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: '#7f6d4f',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#1d2c2b',
    fontSize: 28,
    fontWeight: '800',
  },
  button: {
    backgroundColor: '#1d6b57',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
