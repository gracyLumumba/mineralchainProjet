import { Pressable, StyleSheet, Text, View } from 'react-native';

const ROLES = [
  { key: 'producer', label: 'Producteur' },
  { key: 'regulator', label: 'Regulateur' },
  { key: 'transporter', label: 'Transporteur' },
];

export default function RolePicker({ value, onChange }) {
  return (
    <View style={styles.row}>
      {ROLES.map((role) => (
        <Pressable
          key={role.key}
          onPress={() => onChange(role.key)}
          style={[styles.item, value === role.key ? styles.activeItem : null]}
        >
          <Text style={[styles.label, value === role.key ? styles.activeLabel : null]}>
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
    gap: 8,
  },
  item: {
    backgroundColor: '#eadfcd',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  activeItem: {
    backgroundColor: '#1d6b57',
  },
  label: {
    color: '#6d5a3f',
    fontSize: 13,
    fontWeight: '700',
  },
  activeLabel: {
    color: '#ffffff',
  },
});
