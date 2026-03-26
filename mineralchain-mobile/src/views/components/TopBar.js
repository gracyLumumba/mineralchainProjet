import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TopBar({ onRefresh, onLogout, isRefreshing }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.kicker}>MineralChain</Text>
        <Text style={styles.title}>Kamoa-Kansoko</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onRefresh} style={styles.button}>
          <Text style={styles.buttonText}>
            {isRefreshing ? 'Mise a jour...' : 'Actualiser'}
          </Text>
        </Pressable>
        {onLogout ? (
          <Pressable onPress={onLogout} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Quitter</Text>
          </Pressable>
        ) : null}
      </View>
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
  actions: {
    alignItems: 'flex-end',
    gap: 8,
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
  secondaryButton: {
    backgroundColor: '#e5d8c4',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryText: {
    color: '#17312d',
    fontSize: 13,
    fontWeight: '700',
  },
});
