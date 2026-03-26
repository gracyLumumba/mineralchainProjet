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
    gap: 10,
  },
  item: {
    backgroundColor: '#f7eedf',
    borderColor: '#dac7a5',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  activeItem: {
    backgroundColor: '#1d6b57',
    borderColor: '#1d6b57',
    shadowColor: '#1d6b57',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    color: '#6d5a3f',
    fontSize: 13,
    fontWeight: '800',
  },
  activeLabel: {
    color: '#ffffff',
  },
});
