import { StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function StatusCard({ label, value, tone = 'default' }) {
  const { colors } = usePreferences();
  const isSuccess = tone === 'success';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSuccess ? colors.successBg : colors.card,
          borderColor: isSuccess ? colors.successBorder : colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: colors.accent }]} />
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: isSuccess ? colors.successText : colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    minWidth: 154,
    overflow: 'hidden',
    padding: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  badge: {
    width: 34,
    height: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
});
