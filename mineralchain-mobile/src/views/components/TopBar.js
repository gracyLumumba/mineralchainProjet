import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function TopBar({ onOpenMenu }) {
  const { colors, language, theme, toggleLanguage, toggleTheme } = usePreferences();

  return (
    <View style={styles.row}>
      {onOpenMenu ? (
        <Pressable onPress={onOpenMenu} style={[styles.iconBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="menu" size={22} color={colors.brand} />
        </Pressable>
      ) : null}
      <View style={styles.brandBlock}>
        <Text style={[styles.kicker, { color: colors.accent }]}>MineralChain</Text>
        <Text style={[styles.title, { color: colors.text }]}>Kamoa-Kansoko</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={toggleLanguage} style={[styles.langBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="translate" size={14} color={colors.brand} />
          <Text style={[styles.langText, { color: colors.brand }]}>{language.toUpperCase()}</Text>
        </Pressable>
        <Pressable onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <MaterialCommunityIcons
            name={theme === 'light' ? 'weather-night' : 'weather-sunny'}
            size={18}
            color={theme === 'light' ? '#7c6fcd' : '#f5a623'}
          />
        </Pressable>
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
  brandBlock: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  iconBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 9,
  },
  langBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  langText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
