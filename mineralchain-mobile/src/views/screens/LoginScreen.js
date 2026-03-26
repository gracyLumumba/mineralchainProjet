import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import RolePicker from '../components/RolePicker';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';

function AuthToggle({ mode, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Pressable
        onPress={() => onChange('login')}
        style={[styles.toggleItem, mode === 'login' ? styles.toggleActive : null]}
      >
        <Text style={[styles.toggleText, mode === 'login' ? styles.toggleTextActive : null]}>
          Connexion
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('register')}
        style={[styles.toggleItem, mode === 'register' ? styles.toggleActive : null]}
      >
        <Text style={[styles.toggleText, mode === 'register' ? styles.toggleTextActive : null]}>
          Inscription
        </Text>
      </Pressable>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
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
    submitLogin,
    submitRegister,
  } = useAuthViewModel({ onLogin });

  return (
    <ScreenShell>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Traceabilite miniere</Text>
        <Text style={styles.title}>{mode === 'login' ? 'Connexion' : 'Inscription'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Acces securise aux operations terrain et aux certificats.'
            : 'Creation d un compte operateur pour les flux mobiles.'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardAccent} />
        <AuthToggle mode={mode} onChange={setMode} />

        {mode === 'login' ? (
          <>
            <Text style={styles.label}>Identifiant</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              placeholder="Email ou nom utilisateur"
              placeholderTextColor="#9b8c77"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#9b8c77"
              secureTextEntry
            />

            <Pressable onPress={submitLogin} style={styles.button}>
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </Text>
            </Pressable>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Acces rapides</Text>
              <Text style={styles.hintText}>admin / Admin2025!</Text>
              <Text style={styles.hintText}>producteur / Demo2025!</Text>
              <Text style={styles.hintText}>regulateur / Demo2025!</Text>
              <Text style={styles.hintText}>transporteur / Demo2025!</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              value={registerForm.full_name}
              onChangeText={(value) => updateRegisterField('full_name', value)}
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor="#9b8c77"
            />

            <Text style={styles.label}>Nom utilisateur</Text>
            <TextInput
              value={registerForm.username}
              onChangeText={(value) => updateRegisterField('username', value)}
              style={styles.input}
              placeholder="Nom utilisateur"
              placeholderTextColor="#9b8c77"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={registerForm.email}
              onChangeText={(value) => updateRegisterField('email', value)}
              style={styles.input}
              placeholder="nom@organisation.cd"
              placeholderTextColor="#9b8c77"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={registerForm.password}
              onChangeText={(value) => updateRegisterField('password', value)}
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#9b8c77"
              secureTextEntry
            />

            <Text style={styles.label}>Role</Text>
            <RolePicker
              value={registerForm.role}
              onChange={(value) => updateRegisterField('role', value)}
            />

            <Text style={styles.label}>Organisation</Text>
            <TextInput
              value={registerForm.organization}
              onChangeText={(value) => updateRegisterField('organization', value)}
              style={styles.input}
              placeholder="Organisation"
              placeholderTextColor="#9b8c77"
            />

            <Text style={styles.label}>Site</Text>
            <TextInput
              value={registerForm.site}
              onChangeText={(value) => updateRegisterField('site', value)}
              style={styles.input}
              placeholder="Kamoa-Kansoko"
              placeholderTextColor="#9b8c77"
            />

            <Pressable onPress={submitRegister} style={styles.button}>
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Inscription...' : 'Creer le compte'}
              </Text>
            </Pressable>
          </>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#183632',
    borderRadius: 32,
    gap: 8,
    padding: 24,
    shadowColor: '#183632',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  kicker: {
    color: '#d0b689',
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
    color: '#d7ebe3',
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#fcf8ef',
    borderColor: '#dcccb5',
    borderRadius: 30,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#8c7454',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardAccent: {
    width: 44,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#bf8b4c',
    marginBottom: 2,
  },
  toggleRow: {
    backgroundColor: '#eadfcd',
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
    backgroundColor: '#ffffff',
    shadowColor: '#92785a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  toggleText: {
    color: '#725f44',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#17312d',
  },
  label: {
    color: '#6b5635',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fffdf9',
    borderColor: '#dccbb1',
    borderRadius: 18,
    borderWidth: 1,
    color: '#1d2c2b',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    color: '#8f2d14',
    fontSize: 14,
    fontWeight: '800',
  },
  noticeBox: {
    backgroundColor: '#eef8f2',
    borderColor: '#9cc8ae',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: '#245b49',
    fontSize: 14,
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1d6b57',
    borderRadius: 20,
    marginTop: 8,
    paddingVertical: 15,
    shadowColor: '#1d6b57',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  hintBox: {
    backgroundColor: '#f3e7d4',
    borderRadius: 20,
    gap: 4,
    marginTop: 8,
    padding: 14,
  },
  hintTitle: {
    color: '#5d4b32',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hintText: {
    color: '#6b5a41',
    fontSize: 13,
  },
});
