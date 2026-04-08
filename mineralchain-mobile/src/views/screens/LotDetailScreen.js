import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useLotDetailViewModel } from '../../viewmodels/useLotDetailViewModel';
import { getRoleNextStep } from '../../models/roleInsights';

function DetailLine({ label, value, colors }) {
  return (
    <View style={styles.detailLine}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{String(value)}</Text>
    </View>
  );
}

export default function LotDetailScreen({ route }) {
  const { lotId, session } = route.params;
  const { colors } = usePreferences();
  const { lot, isLoading, isRefreshing, error, refresh } = useLotDetailViewModel(lotId);
  const nextStep = lot ? getRoleNextStep(session, lot) : null;

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.stateText, { color: colors.muted }]}>Chargement du lot...</Text>
        </View>
      ) : error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
          <Text style={[styles.errorTitle, { color: colors.errorText }]}>Erreur de chargement</Text>
          <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={[styles.id, { color: colors.text }]}>{lot.id}</Text>
                <Text style={[styles.caption, { color: colors.muted }]}>Derniere lecture terrain</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
                <Text style={[styles.statusText, { color: colors.badgeText }]}>{lot.status}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={[styles.metaCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Site</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{lot.site}</Text>
              </View>
              <View style={[styles.metaCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Poids</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{lot.weight} t</Text>
              </View>
            </View>
          </View>

          {nextStep ? (
            <View style={[styles.nextStepCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.nextStepLabel, { color: colors.accent }]}>Etape metier</Text>
              <Text style={[styles.nextStepTitle, { color: colors.text }]}>{nextStep.title}</Text>
              <Text style={[styles.nextStepBody, { color: colors.muted }]}>{nextStep.body}</Text>
            </View>
          ) : null}

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracabilite</Text>
            <DetailLine label="Token" value={lot.tokenId ?? 'non certifie'} colors={colors} />
            <DetailLine label="Bloc" value={lot.blockNumber ?? 'non disponible'} colors={colors} />
            <DetailLine label="Minerai" value={lot.mineralType ?? 'non renseigne'} colors={colors} />
            <DetailLine label="Confiance IA" value={lot.confidence ?? 'non disponible'} colors={colors} />
            <DetailLine label="Validation DGMR" value={lot.regulatorValidated ? `oui - ${lot.regulatorValidatedAt || 'date indisponible'}` : 'en attente'} colors={colors} />
            <DetailLine label="Transport" value={lot.transportStatus || 'non demarre'} colors={colors} />
            <DetailLine label="Destination" value={lot.destination || 'non renseignee'} colors={colors} />
            <DetailLine label="Stockage" value={lot.storage} colors={colors} />
          </View>

          <Pressable onPress={refresh} style={[styles.refreshButton, { backgroundColor: colors.brand }]}>
            <Text style={styles.refreshText}>Actualiser ce lot</Text>
          </Pressable>
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stateBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  stateText: {
    fontSize: 14,
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    gap: 16,
    padding: 20,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  id: {
    fontSize: 22,
    fontWeight: '800',
  },
  caption: {
    fontSize: 13,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metaCard: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  nextStepCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  nextStepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  nextStepTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  nextStepBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailLine: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  refreshButton: {
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 15,
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
