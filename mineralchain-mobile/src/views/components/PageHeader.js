import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function PageHeader() {
  const { colors, language, theme, toggleLanguage, toggleTheme } = usePreferences();

  return (
    <View style={styles.row}>
      <Pressable onPress={toggleLanguage} style={[styles.btnLang, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="translate" size={14} color={colors.brand} />
        <Text style={[styles.langText, { color: colors.brand }]}>{language.toUpperCase()}</Text>
      </Pressable>
      <Pressable onPress={toggleTheme} style={[styles.btn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <MaterialCommunityIcons
          name={theme === 'light' ? 'weather-night' : 'weather-sunny'}
          size={17}
          color={theme === 'light' ? '#a78bfa' : '#f5a623'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 9,
  },
  btnLang: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  langText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
