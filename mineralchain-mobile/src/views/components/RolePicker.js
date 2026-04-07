import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

const ROLES = [
  { key: 'producer', label: 'Producteur' },
  { key: 'regulator', label: 'Regulateur' },
  { key: 'transporter', label: 'Transporteur' },
];

export default function RolePicker({ value, onChange }) {
  const { colors } = usePreferences();

  return (
    <View style={styles.row}>
      {ROLES.map((role) => (
        <Pressable
          key={role.key}
          onPress={() => onChange(role.key)}
          style={[
            styles.item,
            {
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            },
            value === role.key
              ? [styles.activeItem, { backgroundColor: colors.brand, borderColor: colors.brand, shadowColor: colors.shadow }]
              : null,
          ]}
        >
          <Text style={[styles.label, { color: value === role.key ? '#ffffff' : colors.text }]}>
            {role.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  activeItem: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
});
