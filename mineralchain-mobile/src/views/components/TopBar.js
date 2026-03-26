import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function TopBar({ onRefresh, onLogout, isRefreshing }) {
  return (
    <View style={styles.row}>
      <View style={styles.brandBlock}>
        <Text style={styles.kicker}>MineralChain</Text>
        <Text style={styles.title}>Kamoa-Kansoko</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onRefresh} style={styles.primaryButton}>
          <Text style={styles.primaryText}>
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandBlock: {
    gap: 2,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  kicker: {
    color: '#8e6a3f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#1b2f2d',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  primaryButton: {
    backgroundColor: '#1c5f53',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#1c5f53',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#f8f0e2',
    borderColor: '#d8c5a8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryText: {
    color: '#6d5435',
    fontSize: 13,
    fontWeight: '800',
  },
});
