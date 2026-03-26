import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import FormField from '../components/FormField';
import { useCertificationViewModel } from '../../viewmodels/useCertificationViewModel';

export default function CertificationScreen({ session }) {
  const { form, result, error, isSubmitting, updateField, submit } =
    useCertificationViewModel(session);

  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Emission</Text>
        <Text style={styles.title}>Certification</Text>
        <Text style={styles.subtitle}>Creation et emission du certificat mineral.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.ribbon} />
        <FormField
          label="Lot ID"
          value={form.lot_id}
          onChangeText={(value) => updateField('lot_id', value)}
          placeholder="MOB-XXXXXX"
        />
        <FormField
          label="Producteur"
          value={form.producer}
          onChangeText={(value) => updateField('producer', value)}
          placeholder="Nom operateur"
        />
        <FormField
          label="Site"
          value={form.site}
          onChangeText={(value) => updateField('site', value)}
          placeholder="Kamoa-Kansoko"
        />
        <FormField
          label="Poids (t)"
          value={form.weight_tonnes}
          onChangeText={(value) => updateField('weight_tonnes', value)}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Cu %"
          value={form.cu_grade_percent}
          onChangeText={(value) => updateField('cu_grade_percent', value)}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Co %"
          value={form.co_grade_percent}
          onChangeText={(value) => updateField('co_grade_percent', value)}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Fe %"
          value={form.fe_percent}
          onChangeText={(value) => updateField('fe_percent', value)}
          keyboardType="decimal-pad"
        />
        <FormField
          label="S %"
          value={form.s_percent}
          onChangeText={(value) => updateField('s_percent', value)}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Densite"
          value={form.density_t_m3}
          onChangeText={(value) => updateField('density_t_m3', value)}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Date extraction"
          value={form.extraction_date}
          onChangeText={(value) => updateField('extraction_date', value)}
          placeholder="YYYY-MM-DD"
        />

        <Pressable onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Traitement...' : 'Lancer la certification'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultEyebrow}>Certificat emis</Text>
          <Text style={styles.resultTitle}>{result.lotId}</Text>
          <Text style={styles.resultLine}>Statut: {result.status}</Text>
          <Text style={styles.resultLine}>Type: {result.mineralType}</Text>
          <Text style={styles.resultLine}>Token: {result.tokenId ?? 'non cree'}</Text>
          <Text style={styles.resultLine}>Bloc: {result.blockNumber ?? 'non disponible'}</Text>
          <Text style={styles.resultLine}>Mode: {result.simulated ? 'simule' : 'reel'}</Text>
          <Text style={styles.resultLine}>IPFS: {result.ipfsHash ?? 'absent'}</Text>

          {result.gatewayUrl ? (
            <Pressable onPress={() => Linking.openURL(result.gatewayUrl)} style={styles.linkButton}>
              <Text style={styles.linkText}>Ouvrir le certificat</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  eyebrow: {
    color: '#8e6a3f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    color: '#1d2c2b',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#5f675c',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fcf8ef',
    borderColor: '#dfcfb6',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#8e7453',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  ribbon: {
    width: 42,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#bf8b4c',
    marginBottom: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1d6b57',
    borderRadius: 18,
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
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  errorTitle: {
    color: '#8f2d14',
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: '#944732',
    fontSize: 14,
    lineHeight: 20,
  },
  resultCard: {
    backgroundColor: '#edf7f0',
    borderColor: '#9cc8ae',
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  resultEyebrow: {
    color: '#2c6b58',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  resultTitle: {
    color: '#1d2c2b',
    fontSize: 22,
    fontWeight: '900',
  },
  resultLine: {
    color: '#38524d',
    fontSize: 14,
    lineHeight: 20,
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#17312d',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
