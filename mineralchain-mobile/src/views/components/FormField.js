import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'sentences',
  autoCorrect = false,
  error,
  helper,
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9b8c77"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    color: '#6b5635',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fffdf9',
    borderColor: '#dccbb1',
    borderRadius: 18,
    borderWidth: 1,
    color: '#1e2f2c',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#8f7759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  inputError: {
    borderColor: '#d56a4d',
  },
  errorText: {
    color: '#9a3412',
    fontSize: 12,
    lineHeight: 18,
  },
  helperText: {
    color: '#7c6b56',
    fontSize: 12,
    lineHeight: 18,
  },
});
