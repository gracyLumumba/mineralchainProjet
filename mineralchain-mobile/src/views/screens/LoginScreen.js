import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import RolePicker from '../components/RolePicker';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';

export default function LoginScreen({ onLogin }) {
  const { name, setName, role, setRole, site, setSite, submit } =
    useAuthViewModel({ onLogin });

  return (
    <ScreenShell>
      <View style={styles.hero}>
        <Text style={styles.kicker}>MineralChain</Text>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Acces aux operations terrain.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Votre nom" />

        <Text style={styles.label}>Role</Text>
        <RolePicker value={role} onChange={setRole} />

        <Text style={styles.label}>Site</Text>
        <TextInput value={site} onChangeText={setSite} style={styles.input} placeholder="Kamoa-Kansoko" />

        <Pressable onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </Pressable>
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
});
