import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    color: '#6b5a41',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d9c9ab',
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
