import { useEffect, useState } from 'react';
import { DevSettings, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import RolePicker from '../components/RolePicker';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import {
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  resetCustomApiBaseUrl,
  setCustomApiBaseUrl,
} from '../../config/api';

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
  const [apiInput, setApiInput] = useState('');
  const [apiNotice, setApiNotice] = useState('');
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
      if (!active) {
        return;
      }
      setApiBaseUrl(value);
      setApiInput(value);
    };

    loadApiUrl();

    return () => {
      active = false;
    };
  }, []);

  const handleSaveApiUrl = async () => {
    await setCustomApiBaseUrl(apiInput);
    const value = await getApiBaseUrl();
    setApiBaseUrl(value);
    setApiInput(value);
    setApiNotice('URL API enregistree.');
  };

  const handleResetApiUrl = async () => {
    await resetCustomApiBaseUrl();
    const value = getDefaultApiBaseUrl();
    setApiBaseUrl(value);
    setApiInput(value);
    setApiNotice('URL API par defaut restauree.');
  };

  return (
    <ScreenShell keyboardShouldPersistTaps="always">
      <AnimatedEntrance delay={0}>
        <View style={[styles.hero, { backgroundColor: colors.brandDark }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>Traceabilite miniere</Text>
              <Text style={styles.title}>{mode === 'login' ? t('login') : t('register')}</Text>
            </View>
            <View style={styles.quickToggles}>
              <Pressable onPress={() => DevSettings.reload()} style={[styles.quickPill, { borderColor: colors.accent }]}>
                <Text style={styles.quickPillText}>{t('reload_app')}</Text>
              </Pressable>
              <Pressable onPress={toggleLanguage} style={[styles.quickPill, { borderColor: colors.accent }]}>
                <Text style={styles.quickPillText}>{language.toUpperCase()}</Text>
              </Pressable>
              <Pressable onPress={toggleTheme} style={[styles.quickPill, { borderColor: colors.accent }]}>
                <Text style={styles.quickPillText}>{theme === 'light' ? t('light') : t('dark')}</Text>
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
              <View style={[styles.demoBox, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <Text style={[styles.demoTitle, { color: colors.text }]}>Comptes demo</Text>
                <Text style={[styles.demoHint, { color: colors.muted }]}>Touchez un role pour preparer une connexion demo, comme sur la version web.</Text>
                <View style={styles.demoGrid}>
                  {demoCredentials.map((credential) => (
                    <Pressable
                      key={credential.key}
                      onPress={() => fillDemoCredentials(credential)}
                      style={[styles.demoCard, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
                    >
                      <Text style={[styles.demoCardTitle, { color: colors.text }]}>{credential.label}</Text>
                      <Text style={[styles.demoCardText, { color: colors.muted }]}>{credential.description}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.apiBox, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}>
                <Text style={[styles.apiTitle, { color: colors.infoText }]}>Connexion API</Text>
                <Text style={[styles.apiHint, { color: colors.infoText }]}>
                  Si le telephone n atteint pas le backend, remplacez l adresse par l IP locale du PC, par exemple 192.168.1.20:5000/api.
                </Text>
                <TextInput
                  value={apiInput}
                  onChangeText={(value) => {
                    setApiInput(value);
                    setApiNotice('');
                  }}
                  style={[styles.input, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="http://192.168.1.20:5000/api"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.apiActions}>
                  <Pressable onPress={handleSaveApiUrl} style={[styles.apiButton, { backgroundColor: colors.brand }]}>
                    <Text style={styles.apiButtonText}>Enregistrer</Text>
                  </Pressable>
                  <Pressable onPress={handleResetApiUrl} style={[styles.apiButtonSecondary, { borderColor: colors.infoBorder }]}>
                    <Text style={[styles.apiButtonSecondaryText, { color: colors.infoText }]}>Par defaut</Text>
                  </Pressable>
                </View>
                <Text style={[styles.apiCurrent, { color: colors.muted }]}>Actuelle: {apiBaseUrl || getDefaultApiBaseUrl()}</Text>
                {apiNotice ? (
                  <Text style={[styles.apiNotice, { color: colors.successText }]}>{apiNotice}</Text>
                ) : null}
              </View>

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
    gap: 12,
  },
  quickToggles: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quickPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quickPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  demoBox: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  demoHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  demoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  demoCardText: {
    fontSize: 12,
    lineHeight: 18,
  },
  apiBox: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginTop: 2,
    padding: 14,
  },
  apiTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  apiHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  apiActions: {
    flexDirection: 'row',
    gap: 10,
  },
  apiButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 12,
  },
  apiButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  apiButtonSecondary: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  apiButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  apiCurrent: {
    fontSize: 12,
    lineHeight: 18,
  },
  apiNotice: {
    fontSize: 12,
    fontWeight: '700',
  },
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
  button: {
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 8,
    paddingVertical: 15,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
