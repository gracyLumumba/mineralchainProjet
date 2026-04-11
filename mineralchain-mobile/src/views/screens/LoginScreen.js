import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import RolePicker from '../components/RolePicker';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import { getApiBaseUrl } from '../../config/api';

function AuthToggle({ mode, onChange, colors, t }) {
  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.cardAlt }]}>
      <Pressable
        onPress={() => onChange('login')}
        style={[styles.toggleItem, mode === 'login' ? [styles.toggleActive, { backgroundColor: colors.input }] : null]}
      >
        <Text style={[styles.toggleText, { color: colors.muted }, mode === 'login' ? [styles.toggleTextActive, { color: colors.text }] : null]}>
          {t('login')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('register')}
        style={[styles.toggleItem, mode === 'register' ? [styles.toggleActive, { backgroundColor: colors.input }] : null]}
      >
        <Text style={[styles.toggleText, { color: colors.muted }, mode === 'register' ? [styles.toggleTextActive, { color: colors.text }] : null]}>
          {t('register')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
  const { colors, language, theme, toggleLanguage, toggleTheme, t } = usePreferences();
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const {
    mode,
    setMode,
    identifier,
    setIdentifier,
    password,
    setPassword,
    registerForm,
    updateRegisterField,
    isSubmitting,
    error,
    notice,
    demoCredentials,
    fillDemoCredentials,
    submitLogin,
    submitRegister,
  } = useAuthViewModel({ onLogin });

  useEffect(() => {
    let active = true;
    const loadApiUrl = async () => {
      const value = await getApiBaseUrl();
      if (!active) return;
      setApiBaseUrl(value);
    };
    loadApiUrl();
    return () => { active = false; };
  }, []);

  const mainDemos = demoCredentials.filter((c) => !c.isAdmin);
  const adminDemo = demoCredentials.filter((c) => c.isAdmin);

  return (
    <ScreenShell keyboardShouldPersistTaps="always">
      <AnimatedEntrance delay={0}>
        <View style={[styles.hero, { backgroundColor: colors.brandDark }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>Traceabilite miniere</Text>
              <Text style={styles.title}>{mode === 'login' ? t('login') : t('register')}</Text>
            </View>
            <View style={styles.heroControls}>
              <Pressable onPress={toggleLanguage} style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialCommunityIcons name="translate" size={14} color={colors.accent} />
                <Text style={[styles.controlBtnText, { color: colors.accent }]}>{language.toUpperCase()}</Text>
              </Pressable>
              <Pressable onPress={toggleTheme} style={[styles.controlBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialCommunityIcons
                  name={theme === 'light' ? 'weather-night' : 'weather-sunny'}
                  size={16}
                  color={theme === 'light' ? '#a78bfa' : '#f5a623'}
                />
              </Pressable>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.surfaceStrongText }]}>
            {mode === 'login' ? t('secure_access') : t('create_account')}
          </Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={90}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardAccent, { backgroundColor: colors.accent }]} />
          <AuthToggle mode={mode} onChange={setMode} colors={colors} t={t} />

          {mode === 'login' ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('identifier')}</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t('email_or_username')}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('password')}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t('password')}
                placeholderTextColor={colors.muted}
                secureTextEntry
              />

              <Pressable onPress={submitLogin} style={[styles.button, { backgroundColor: colors.brand }]}>
                <Text style={styles.buttonText}>
                  {isSubmitting ? t('signing_in') : t('sign_in')}
                </Text>
              </Pressable>

              <Text style={[styles.demoSectionTitle, { color: colors.muted }]}>COMPTES DEMO</Text>

              <View style={styles.demoGrid}>
                {mainDemos.map((credential) => (
                  <Pressable
                    key={credential.key}
                    onPress={() => fillDemoCredentials(credential)}
                    style={[styles.demoCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                  >
                    <MaterialCommunityIcons name={credential.icon} size={22} color={colors.accent} />
                    <Text style={[styles.demoCardTitle, { color: colors.text }]}>{credential.label}</Text>
                    <Text style={[styles.demoCardUser, { color: colors.muted }]}>{credential.identifier}</Text>
                  </Pressable>
                ))}
              </View>

              {adminDemo.map((credential) => (
                <Pressable
                  key={credential.key}
                  onPress={() => fillDemoCredentials(credential)}
                  style={[styles.demoCardAdmin, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name={credential.icon} size={22} color={colors.accent} />
                  <View style={styles.demoCardAdminText}>
                    <Text style={[styles.demoCardTitle, { color: colors.text }]}>{credential.label}</Text>
                    <Text style={[styles.demoCardUser, { color: colors.muted }]}>{credential.identifier} · {credential.description}</Text>
                  </View>
                </Pressable>
              ))}


            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('full_name')}</Text>
              <TextInput
                value={registerForm.full_name}
                onChangeText={(value) => updateRegisterField('full_name', value)}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t('full_name')}
                placeholderTextColor={colors.muted}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('username')}</Text>
              <TextInput
                value={registerForm.username}
                onChangeText={(value) => updateRegisterField('username', value)}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t('username')}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('email')}</Text>
              <TextInput
                value={registerForm.email}
                onChangeText={(value) => updateRegisterField('email', value)}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="nom@organisation.cd"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('password')}</Text>
              <TextInput
                value={registerForm.password}
                onChangeText={(value) => updateRegisterField('password', value)}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t('password')}
                placeholderTextColor={colors.muted}
                secureTextEntry
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('role')}</Text>
              <RolePicker
                value={registerForm.role}
                onChange={(value) => updateRegisterField('role', value)}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('organization')}</Text>
              <TextInput
                value={registerForm.organization}
                onChangeText={(value) => updateRegisterField('organization', value)}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t('organization')}
                placeholderTextColor={colors.muted}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('site')}</Text>
              <TextInput
                value={registerForm.site}
                onChangeText={(value) => updateRegisterField('site', value)}
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Kamoa-Kansoko"
                placeholderTextColor={colors.muted}
              />

              <Pressable onPress={submitRegister} style={[styles.button, { backgroundColor: colors.brand }]}>
                <Text style={styles.buttonText}>
                  {isSubmitting ? t('creating_account') : t('create_account_btn')}
                </Text>
              </Pressable>
            </>
          )}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
              <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
            </View>
          ) : null}

          {notice ? (
            <View style={[styles.noticeBox, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
              <Text style={[styles.noticeText, { color: colors.successText }]}>{notice}</Text>
            </View>
          ) : null}
        </View>
      </AnimatedEntrance>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 32,
    gap: 8,
    padding: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroControls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  controlBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
  },
  cardAccent: {
    width: 44,
    height: 6,
    borderRadius: 999,
    marginBottom: 2,
  },
  toggleRow: {
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  toggleItem: {
    borderRadius: 999,
    flex: 1,
    paddingVertical: 11,
  },
  toggleActive: {
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  toggleTextActive: {},
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 4,
    paddingVertical: 15,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  demoCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  demoCardAdmin: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  demoCardAdminText: {
    flex: 1,
    gap: 2,
  },
  demoCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  demoCardUser: {
    fontSize: 11,
    textAlign: 'center',
  },

  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '800',
  },
  noticeBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
