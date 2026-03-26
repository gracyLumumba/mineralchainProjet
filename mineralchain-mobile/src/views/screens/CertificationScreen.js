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
        <Text style={styles.title}>Certification</Text>
        <Text style={styles.subtitle}>Creation et emission du certificat.</Text>
      </View>

      <View style={styles.card}>
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
  title: {
    color: '#1d2c2b',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#5f675c',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fffaf2',
    borderRadius: 24,
    gap: 12,
    padding: 18,
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
  errorBox: {
    backgroundColor: '#fff0ed',
    borderColor: '#efb0a0',
    borderRadius: 20,
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
    backgroundColor: '#eef8f2',
    borderColor: '#9cc8ae',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  resultTitle: {
    color: '#1d2c2b',
    fontSize: 20,
    fontWeight: '800',
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
    fontWeight: '700',
  },
});
