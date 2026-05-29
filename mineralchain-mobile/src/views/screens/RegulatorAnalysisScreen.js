import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import ScreenShell from '../components/ScreenShell';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

const FIELD_LABELS = {
  cu_grade_percent: 'Cuivre — Cu (%)',
  co_grade_percent: 'Cobalt — Co (%)',
  fe_percent: 'Fer — Fe (%)',
  s_percent: 'Soufre — S (%)',
  density_t_m3: 'Densité (t/m³)',
  weight_tonnes: 'Poids (t)',
};

const TOLERANCES = {
  cu_grade_percent: 0.5,
  co_grade_percent: 0.3,
  fe_percent: 1.0,
  s_percent: 0.5,
  density_t_m3: 0.15,
  weight_tonnes: 5.0,
};

// ── Barre de progression ──────────────────────────────────────────────────────
function StepBar({ step, colors }) {
  const steps = ['Lot', 'Analyse', 'Résultat'];
  return (
    <View style={styles.stepBar}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step >= n;
        return (
          <View key={n} style={styles.stepItem}>
            <View style={[styles.stepDot, {
              backgroundColor: active ? colors.brand : colors.cardAlt,
              borderColor: active ? colors.brand : colors.border,
            }]}>
              {step > n
                ? <MaterialCommunityIcons name="check" size={12} color="#fff" />
                : <Text style={[styles.stepNum, { color: active ? '#fff' : colors.muted }]}>{n}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, { color: active ? colors.brand : colors.muted }]}>{label}</Text>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: step > n ? colors.brand : colors.border }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Ligne de comparaison ──────────────────────────────────────────────────────
function CompareRow({ item, colors }) {
  const pct = Math.min((item.diff / item.tolerance) * 100, 100);
  const ok = item.ok;
  return (
    <View style={[styles.compareRow, { borderColor: colors.border, backgroundColor: ok ? 'transparent' : colors.errorBg + '44' }]}>
      <Text style={[styles.compareField, { color: colors.text }]}>{FIELD_LABELS[item.field] || item.field}</Text>
      <View style={styles.compareVals}>
        <View style={styles.compareValCol}>
          <Text style={[styles.compareValLabel, { color: colors.muted }]}>Prod.</Text>
          <Text style={[styles.compareVal, { color: colors.brand }]}>{item.prodVal?.toFixed(3)}</Text>
        </View>
        <View style={styles.compareValCol}>
          <Text style={[styles.compareValLabel, { color: colors.muted }]}>DGMR</Text>
          <Text style={[styles.compareVal, { color: colors.successText }]}>{item.regVal?.toFixed(3)}</Text>
        </View>
        <View style={styles.compareValCol}>
          <Text style={[styles.compareValLabel, { color: colors.muted }]}>Δ</Text>
          <Text style={[styles.compareVal, { color: ok ? colors.muted : colors.errorText }]}>{item.diff?.toFixed(3)}</Text>
        </View>
      </View>
      <View style={styles.compareBar}>
        <View style={[styles.compareBarTrack, { backgroundColor: colors.cardAlt }]}>
          <View style={[styles.compareBarFill, { width: `${pct}%`, backgroundColor: ok ? colors.successText : colors.errorText }]} />
        </View>
        <Text style={[styles.compareTol, { color: colors.muted }]}>±{item.tolerance}</Text>
      </View>
      <View style={[styles.compareBadge, { backgroundColor: ok ? colors.successBg : colors.errorBg, borderColor: ok ? colors.successBorder : colors.errorBorder }]}>
        <MaterialCommunityIcons name={ok ? 'check' : 'close'} size={12} color={ok ? colors.successText : colors.errorText} />
      </View>
    </View>
  );
}

// ── Carte lot en attente ──────────────────────────────────────────────────────
function LotPendingCard({ lot, colors, onSelect, disabled }) {
  return (
    <Pressable
      onPress={() => onSelect(lot)}
      disabled={disabled}
      style={({ pressed }) => [styles.pendingCard, { backgroundColor: pressed ? colors.cardAlt : colors.card, borderColor: colors.border }]}
    >
      <View style={styles.pendingHeader}>
        <Text style={[styles.pendingId, { color: colors.brand }]}>{lot.id}</Text>
        <View style={[styles.statusPill, { backgroundColor: colors.ghostButton }]}>
          <Text style={[styles.statusPillText, { color: colors.text }]}>{lot.status}</Text>
        </View>
      </View>
      <View style={styles.pendingMeta}>
        <Text style={[styles.metaItem, { color: colors.muted }]}>{lot.site}</Text>
        <Text style={[styles.metaItem, { color: colors.muted }]}>Cu: {lot.cuGradePercent ?? '—'}%</Text>
        <Text style={[styles.metaItem, { color: colors.muted }]}>Co: {lot.coGradePercent ?? '—'}%</Text>
      </View>
      <View style={styles.pendingAction}>
        <MaterialCommunityIcons name="check-decagram" size={14} color={colors.brand} />
        <Text style={[styles.pendingActionText, { color: colors.brand }]}>Fichier labo requis</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color={colors.muted} />
      </View>
    </Pressable>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function RegulatorAnalysisScreen({ lots = [], isRefreshing, refresh }) {
  const { colors } = usePreferences();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [result, setResult] = useState(null);

  const pendingLots = lots.filter((l) => l.analyzedAt && !l.regulatorValidated && l.status !== 'SUSPECT');

  const filteredPending = query.trim()
    ? pendingLots.filter((l) => l.id?.toLowerCase().includes(query.toLowerCase()) || l.site?.toLowerCase().includes(query.toLowerCase()))
    : pendingLots;

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    setResult(null);
    setStep(2);
  };


  const reset = () => {
    setStep(1);
    setQuery('');
    setSelectedLot(null);
    setResult(null);
  };

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      {/* En-tête */}
      <AnimatedEntrance delay={0}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>DGMR · Validation</Text>
          <Text style={[styles.title, { color: colors.text }]}>Double analyse</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Comparaison des donnees producteur avec le fichier labo DGMR.
          </Text>
        </View>
      </AnimatedEntrance>

      {/* Barre de progression */}
      <AnimatedEntrance delay={20}>
        <StepBar step={step} colors={colors} />
      </AnimatedEntrance>

      {/* ── ÉTAPE 1 : Sélection du lot ── */}
      {step === 1 && (
        <AnimatedEntrance delay={40}>
          <View style={styles.section}>
            {/* Recherche */}
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Rechercher un lot..."
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {/* Compteur */}
            <View style={styles.countRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.accent} />
              <Text style={[styles.countText, { color: colors.accent }]}>
                {filteredPending.length} lot{filteredPending.length > 1 ? 's' : ''} en attente de validation
              </Text>
            </View>

            {/* Liste */}
            {filteredPending.length > 0 ? (
              <View style={styles.lotList}>
                {filteredPending.map((lot, idx) => (
                  <AnimatedEntrance key={lot.id} delay={60 + idx * 15}>
                    <LotPendingCard lot={lot} colors={colors} onSelect={handleSelectLot} disabled={false} />
                  </AnimatedEntrance>
                ))}
              </View>
            ) : (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="check-circle" size={32} color={colors.successText} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun lot en attente</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Tous les lots ont été validés</Text>
              </View>
            )}
          </View>
        </AnimatedEntrance>
      )}

      {/* ── ÉTAPE 2 : Confirmation + lancement ── */}
      {step === 2 && selectedLot && (
        <AnimatedEntrance delay={40}>
          <View style={styles.section}>
            {/* Fiche lot */}
            <View style={[styles.lotDetailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.lotDetailHeader}>
                <Text style={[styles.lotDetailId, { color: colors.brand }]}>{selectedLot.id}</Text>
                <View style={[styles.statusPill, { backgroundColor: colors.ghostButton }]}>
                  <Text style={[styles.statusPillText, { color: colors.text }]}>{selectedLot.status}</Text>
                </View>
              </View>
              <View style={[styles.lotDetailGrid, { borderColor: colors.border }]}>
                {[
                  ['Site', selectedLot.site],
                  ['Type minéral', selectedLot.mineralType],
                  ['Cu (%)', selectedLot.cuGradePercent ?? '—'],
                  ['Co (%)', selectedLot.coGradePercent ?? '—'],
                  ['Fe (%)', selectedLot.fePercent ?? '—'],
                  ['Poids (t)', selectedLot.weightTonnes ?? '—'],
                ].map(([label, val]) => (
                  <View key={label} style={[styles.detailRow, { borderColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Info méthode */}
            <View style={[styles.infoBox, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.infoText} />
              <Text style={[styles.infoText, { color: colors.infoText }]}>
                La double analyse est autorisee uniquement avec un fichier labo DGMR importe. Aucun resultat DGMR simule n'est accepte.
              </Text>
            </View>


            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]} >
              <MaterialCommunityIcons name="file-excel-outline" size={16} color={colors.brand} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Ouvrez l'interface web regulateur et importez votre fichier labo pour lancer la comparaison.
              </Text>
            </View>

            <Pressable disabled style={[styles.analyseBtn, { backgroundColor: colors.muted }]}>
              <MaterialCommunityIcons name="file-excel-outline" size={18} color="#fff" />
              <Text style={styles.analyseBtnText}>Fichier labo obligatoire</Text>
            </Pressable>
            <Pressable onPress={reset} style={[styles.backBtn, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="arrow-left" size={16} color={colors.muted} />
              <Text style={[styles.backBtnText, { color: colors.muted }]}>Retour</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      )}

      {/* ── ÉTAPE 3 : Résultat justifié ── */}
      {step === 3 && result && selectedLot && (
        <AnimatedEntrance delay={40}>
          <View style={styles.section}>
            {/* Bandeau résumé */}
            <View style={[styles.resultBanner, {
              backgroundColor: result.allOk ? colors.successBg : colors.errorBg,
              borderColor: result.allOk ? colors.successBorder : colors.errorBorder,
            }]}>
              <MaterialCommunityIcons
                name={result.allOk ? 'check-circle' : 'alert-circle'}
                size={28}
                color={result.allOk ? colors.successText : colors.errorText}
              />
              <View style={styles.resultBannerText}>
                <Text style={[styles.resultStatus, { color: result.allOk ? colors.successText : colors.errorText }]}>
                  {result.status}
                </Text>
                <Text style={[styles.resultSummary, { color: colors.muted }]}>
                  {result.conformes}/{result.total} paramètres conformes · {selectedLot.id}
                </Text>
                <Text style={[styles.resultSite, { color: colors.muted }]}>{selectedLot.site}</Text>
              </View>
            </View>

            {/* Tableau de comparaison */}
            <View style={[styles.compareTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* En-tête tableau */}
              <View style={[styles.compareHeader, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <Text style={[styles.compareHeaderText, { color: colors.muted, flex: 2 }]}>Paramètre</Text>
                <Text style={[styles.compareHeaderText, { color: colors.brand }]}>Prod.</Text>
                <Text style={[styles.compareHeaderText, { color: colors.successText }]}>DGMR</Text>
                <Text style={[styles.compareHeaderText, { color: colors.muted }]}>Δ</Text>
                <Text style={[styles.compareHeaderText, { color: colors.muted }]}>Tol.</Text>
                <Text style={[styles.compareHeaderText, { color: colors.muted }]}>OK</Text>
              </View>

              <ScrollView nestedScrollEnabled style={{ maxHeight: 320 }}>
                {result.comparison.map((item, i) => (
                  <CompareRow key={i} item={item} colors={colors} />
                ))}
              </ScrollView>

              {/* Pied tableau */}
              <View style={[styles.compareFooter, { borderColor: colors.border }]}>
                <Text style={[styles.compareFooterText, { color: colors.muted }]}>
                  Normes CEEC/DGMR · {new Date().toLocaleDateString('fr-FR')}
                </Text>
                <Text style={[styles.compareFooterText, {
                  color: result.allOk ? colors.successText : colors.errorText,
                  fontWeight: '800',
                }]}>
                  {result.allOk ? 'Conforme ✓' : `${result.total - result.conformes} divergence(s)`}
                </Text>
              </View>
            </View>

            {/* Message résultat */}
            <View style={[styles.verdictBox, {
              backgroundColor: result.allOk ? colors.successBg : colors.errorBg,
              borderColor: result.allOk ? colors.successBorder : colors.errorBorder,
            }]}>
              <Text style={[styles.verdictText, { color: result.allOk ? colors.successText : colors.errorText }]}>
                {result.allOk
                  ? `✓ Lot ${selectedLot.id} validé — transport autorisé`
                  : `✗ Lot ${selectedLot.id} marqué SUSPECT — transport bloqué`}
              </Text>
            </View>

            <Pressable onPress={reset} style={[styles.newBtn, { backgroundColor: colors.brand }]}>
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.newBtnText}>Nouvelle analyse</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20 },

  // Step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 12, fontWeight: '800' },
  stepLabel: { fontSize: 11, fontWeight: '700' },
  stepLine: { width: 32, height: 2, marginHorizontal: 4 },

  section: { gap: 14 },

  // Recherche
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontSize: 12, fontWeight: '700' },
  lotList: { gap: 10 },

  // Carte lot en attente
  pendingCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingId: { fontSize: 14, fontWeight: '900', flex: 1 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  pendingMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { fontSize: 12 },
  pendingAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingActionText: { fontSize: 12, fontWeight: '700', flex: 1 },

  // Fiche lot détail
  lotDetailCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  lotDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lotDetailId: { fontSize: 16, fontWeight: '900', flex: 1 },
  lotDetailGrid: { gap: 0 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  detailLabel: { fontSize: 12, fontWeight: '600' },
  detailVal: { fontSize: 13, fontWeight: '700' },

  // Info box
  infoBox: { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Error
  errorBox: { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Boutons
  analyseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  analyseBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, borderWidth: 1, paddingVertical: 12 },
  backBtnText: { fontSize: 13, fontWeight: '700' },

  // Résultat
  resultBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 18, borderWidth: 1, padding: 16 },
  resultBannerText: { flex: 1, gap: 3 },
  resultStatus: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  resultSummary: { fontSize: 13 },
  resultSite: { fontSize: 12 },

  // Tableau comparaison
  compareTable: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  compareHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, gap: 6 },
  compareHeaderText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', flex: 1 },
  compareRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderBottomWidth: 1 },
  compareField: { fontSize: 12, fontWeight: '700' },
  compareVals: { flexDirection: 'row', gap: 8 },
  compareValCol: { flex: 1, alignItems: 'center', gap: 2 },
  compareValLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  compareVal: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  compareBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareBarTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  compareBarFill: { height: '100%', borderRadius: 2 },
  compareTol: { fontSize: 10, minWidth: 32, textAlign: 'right' },
  compareBadge: { alignSelf: 'flex-end', borderRadius: 6, borderWidth: 1, padding: 3 },
  compareFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1 },
  compareFooterText: { fontSize: 11 },

  // Verdict
  verdictBox: { borderRadius: 14, borderWidth: 1, padding: 14 },
  verdictText: { fontSize: 14, fontWeight: '800', textAlign: 'center' },

  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  // Empty
  empty: { alignItems: 'center', borderRadius: 22, borderWidth: 1, gap: 10, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
