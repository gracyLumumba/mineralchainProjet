import { StyleSheet, Text, TextInput, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

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
  const { colors } = usePreferences();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.errorBorder : colors.inputBorder,
            color: colors.text,
          },
        ]}
      />
      {error ? <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text> : null}
      {!error && helper ? <Text style={[styles.helperText, { color: colors.muted }]}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
