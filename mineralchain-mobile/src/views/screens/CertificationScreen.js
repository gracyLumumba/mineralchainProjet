import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import FormField from '../components/FormField';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCertificationViewModel } from '../../viewmodels/useCertificationViewModel';
import { API_BASE_URL } from '../../config/api';

export default function CertificationScreen({ session }) {
  const { t } = usePreferences();
  const {
    form,
    result,
    error,
    fieldErrors,
    isSubmitting,
    updateField,
    submit,
    resetForm,
  } = useCertificationViewModel(session);

  return (
    <ScreenShell keyboardShouldPersistTaps="always">
      <AnimatedEntrance delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('issuance')}</Text>
          <Text style={styles.title}>{t('certification')}</Text>
          <Text style={styles.subtitle}>{t('cert_subtitle')}</Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={30}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>API</Text>
          <Text style={styles.infoValue}>{API_BASE_URL}</Text>
          <Text style={styles.infoHint}>Utile pour verifier rapidement que le telephone pointe vers le bon backend.</Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={80}>
        <View style={styles.card}>
          <View style={styles.ribbon} />
          <FormField
            label="Lot ID"
            value={form.lot_id}
            onChangeText={(value) => updateField('lot_id', value)}
            placeholder="MOB-XXXXXX"
            autoCapitalize="characters"
            error={fieldErrors.lot_id}
          />
          <FormField
            label="Producteur"
            value={form.producer}
            onChangeText={(value) => updateField('producer', value)}
            placeholder="Nom operateur"
            error={fieldErrors.producer}
          />
          <FormField
            label="Site"
            value={form.site}
            onChangeText={(value) => updateField('site', value)}
            placeholder="Kamoa-Kansoko"
            error={fieldErrors.site}
          />
          <FormField
            label="Poids (t)"
            value={form.weight_tonnes}
            onChangeText={(value) => updateField('weight_tonnes', value)}
            keyboardType="decimal-pad"
            helper="Exemple : 125.4"
            error={fieldErrors.weight_tonnes}
          />
          <FormField
            label="Cu %"
            value={form.cu_grade_percent}
            onChangeText={(value) => updateField('cu_grade_percent', value)}
            keyboardType="decimal-pad"
            error={fieldErrors.cu_grade_percent}
          />
          <FormField
            label="Co %"
            value={form.co_grade_percent}
            onChangeText={(value) => updateField('co_grade_percent', value)}
            keyboardType="decimal-pad"
            error={fieldErrors.co_grade_percent}
          />
          <FormField
            label="Fe %"
            value={form.fe_percent}
            onChangeText={(value) => updateField('fe_percent', value)}
            keyboardType="decimal-pad"
            error={fieldErrors.fe_percent}
          />
          <FormField
            label="S %"
            value={form.s_percent}
            onChangeText={(value) => updateField('s_percent', value)}
            keyboardType="decimal-pad"
            error={fieldErrors.s_percent}
          />
          <FormField
            label="Densite"
            value={form.density_t_m3}
            onChangeText={(value) => updateField('density_t_m3', value)}
            keyboardType="decimal-pad"
            helper="Exemple : 2.7 t/m3"
            error={fieldErrors.density_t_m3}
          />
          <FormField
            label="Date extraction"
            value={form.extraction_date}
            onChangeText={(value) => updateField('extraction_date', value)}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            helper="Format attendu : 2026-04-07"
            error={fieldErrors.extraction_date}
          />

          <View style={styles.actionRow}>
            <Pressable onPress={submit} style={[styles.button, isSubmitting ? styles.buttonDisabled : null]} disabled={isSubmitting}>
              <Text style={styles.buttonText}>
                {isSubmitting ? t('processing') : t('launch_certification')}
              </Text>
            </Pressable>
            <Pressable onPress={resetForm} style={styles.secondaryButton} disabled={isSubmitting}>
              <Text style={styles.secondaryButtonText}>Reinitialiser</Text>
            </Pressable>
          </View>
        </View>
      </AnimatedEntrance>

      {error ? (
        <AnimatedEntrance delay={130}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{t('error')}</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      {result ? (
        <AnimatedEntrance delay={170}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEyebrow}>{t('certificate_issued')}</Text>
            <Text style={styles.resultTitle}>{result.lotId}</Text>
            <Text style={styles.resultLine}>Statut: {result.status}</Text>
            <Text style={styles.resultLine}>Type: {result.mineralType}</Text>
            <Text style={styles.resultLine}>Confiance: {(result.confidence * 100).toFixed(1)}%</Text>
            <Text style={styles.resultLine}>Token: {result.tokenId ?? 'non cree'}</Text>
            <Text style={styles.resultLine}>Bloc: {result.blockNumber ?? 'non disponible'}</Text>
            <Text style={styles.resultLine}>Mode: {result.simulated ? 'simule' : 'reel'}</Text>
            <Text style={styles.resultLine}>IPFS: {result.ipfsHash ?? 'absent'}</Text>

            {result.gatewayUrl ? (
              <Pressable onPress={() => Linking.openURL(result.gatewayUrl)} style={styles.linkButton}>
                <Text style={styles.linkText}>{t('open_certificate')}</Text>
              </Pressable>
            ) : null}
          </View>
        </AnimatedEntrance>
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
  infoCard: {
    backgroundColor: '#f0f7ff',
    borderColor: '#bfd4ef',
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  infoLabel: {
    color: '#29527a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#17324c',
    fontSize: 14,
    fontWeight: '800',
  },
  infoHint: {
    color: '#496784',
    fontSize: 12,
    lineHeight: 18,
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
  actionRow: {
    gap: 10,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1d6b57',
    borderRadius: 18,
    paddingVertical: 15,
    shadowColor: '#1d6b57',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#efe3d2',
    borderRadius: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#6b5635',
    fontSize: 14,
    fontWeight: '800',
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
