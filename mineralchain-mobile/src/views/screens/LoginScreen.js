import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';

export default function LoginScreen({ onLogin }) {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    isSubmitting,
    error,
    submit,
  } = useAuthViewModel({ onLogin });

  return (
    <ScreenShell>
      <View style={styles.hero}>
        <Text style={styles.kicker}>MineralChain</Text>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Acces aux operations terrain.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Identifiant</Text>
        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          style={styles.input}
          placeholder="Email ou nom utilisateur"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </Text>
        </Pressable>

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Comptes disponibles</Text>
          <Text style={styles.hintText}>admin / Admin2025!</Text>
          <Text style={styles.hintText}>producteur / Demo2025!</Text>
          <Text style={styles.hintText}>regulateur / Demo2025!</Text>
          <Text style={styles.hintText}>transporteur / Demo2025!</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#17312d',
    borderRadius: 28,
    gap: 8,
    padding: 24,
  },
  kicker: {
    color: '#a5d0bc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#d9ede6',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fffaf2',
    borderRadius: 24,
    gap: 12,
    padding: 18,
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
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    color: '#8f2d14',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1d6b57',
    borderRadius: 18,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  hintBox: {
    backgroundColor: '#efe5d4',
    borderRadius: 18,
    gap: 4,
    marginTop: 6,
    padding: 14,
  },
  hintTitle: {
    color: '#5d4b32',
    fontSize: 13,
    fontWeight: '800',
  },
  hintText: {
    color: '#6b5a41',
    fontSize: 13,
  },
});
