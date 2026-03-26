import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function TopBar({ onRefresh, onLogout, isRefreshing }) {
  const { colors, language, theme, toggleLanguage, toggleTheme, t } = usePreferences();

  return (
    <View style={styles.row}>
      <View style={styles.brandBlock}>
        <Text style={[styles.kicker, { color: colors.accent }]}>MineralChain</Text>
        <Text style={[styles.title, { color: colors.text }]}>Kamoa-Kansoko</Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.switches}>
          <Pressable onPress={toggleLanguage} style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.text }]}>{language.toUpperCase()}</Text>
          </Pressable>
          <Pressable onPress={toggleTheme} style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.text }]}>{theme === 'light' ? t('light') : t('dark')}</Text>
          </Pressable>
        </View>
        <Pressable onPress={onRefresh} style={[styles.primaryButton, { backgroundColor: colors.brand }]}>
          <Text style={styles.primaryText}>
            {isRefreshing ? t('refreshing') : t('refresh')}
          </Text>
        </Pressable>
        {onLogout ? (
          <Pressable onPress={onLogout} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.secondaryText, { color: colors.text }]}>{t('logout')}</Text>
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
  switches: {
    flexDirection: 'row',
    gap: 8,
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
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
