import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

function StatCard({ label, value, icon, tone, colors }) {
  const bg = tone === 'danger' ? colors.errorBg
    : tone === 'warning' ? colors.ghostButton
    : tone === 'success' ? colors.successBg
    : colors.cardAlt;
  const textColor = tone === 'danger' ? colors.errorText
    : tone === 'warning' ? colors.accent
    : tone === 'success' ? colors.successText
    : colors.text;
  const border = tone === 'danger' ? colors.errorBorder
    : tone === 'warning' ? colors.border
    : tone === 'success' ? colors.successBorder
    : colors.border;

  return (
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
      <MaterialCommunityIcons name={icon} size={20} color={textColor} />
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function ConfidenceBar({ value, colors }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? colors.successText : pct >= 50 ? colors.accent : colors.errorText;
  return (
    <View style={styles.confRow}>
      <View style={[styles.confTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.confFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.confText, { color }]}>{pct}%</Text>
    </View>
  );
}

function StatusBadge({ status, colors }) {
  const color = status === 'AUTHENTIQUE' ? colors.successText
    : status === 'SUSPECT' ? colors.errorText
    : colors.accent;
  const bg = status === 'AUTHENTIQUE' ? colors.successBg
    : status === 'SUSPECT' ? colors.errorBg
    : colors.ghostButton;
  const border = status === 'AUTHENTIQUE' ? colors.successBorder
    : status === 'SUSPECT' ? colors.errorBorder
    : colors.border;
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function MineralBadge({ type, colors }) {
  const color = type === 'copper' ? '#c9a84c'
    : type === 'cobalt' ? colors.brand
    : colors.muted;
  const label = type === 'copper' ? 'Cuivre' : type === 'cobalt' ? 'Cobalt' : type || '—';
  return (
    <View style={[styles.mineralBadge, { borderColor: color }]}>
      <Text style={[styles.mineralText, { color }]}>{label}</Text>
    </View>
  );
}

export default function ProducerScreen({ lots = [], isRefreshing, refresh, onOpenCertification, onOpenLots }) {
  const { colors } = usePreferences();

  const totalLots = lots.length;
  const certified = lots.filter((l) => l.tokenId != null).length;
  const suspects = lots.filter((l) => l.status === 'SUSPECT').length;
  const pendingVal = lots.filter((l) => l.analyzedAt && !l.regulatorValidated && l.status !== 'SUSPECT').length;
  const authRate = totalLots > 0 ? Math.round((lots.filter((l) => l.status === 'AUTHENTIQUE').length / totalLots) * 100) : 0;

  const copperCount = lots.filter((l) => l.mineralType === 'copper').length;
  const cobaltCount = lots.filter((l) => l.mineralType === 'cobalt').length;
  const mixedCount  = lots.filter((l) => l.mineralType === 'mixed').length;

  const recentLots = lots.slice(0, 6);

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Production · Kamoa</Text>
          <Text style={[styles.title, { color: colors.text }]}>Tableau de bord</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Soumission, certification et suivi on-chain des lots.</Text>
        </View>
      </AnimatedEntrance>

      {/* Alerte en attente DGMR */}
      {pendingVal > 0 && (
        <AnimatedEntrance delay={60}>
          <View style={[styles.alertBox, { backgroundColor: colors.ghostButton, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.accent} />
            <Text style={[styles.alertText, { color: colors.accent }]}>
              {pendingVal} lot{pendingVal > 1 ? 's' : ''} en attente de validation DGMR
            </Text>
          </View>
        </AnimatedEntrance>
      )}

      {/* Stats */}
      <AnimatedEntrance delay={80}>
        <View style={styles.statsGrid}>
          <StatCard label="Total lots"    value={totalLots}        icon="layers"          tone="default"  colors={colors} />
          <StatCard label="Certifiés"     value={certified}        icon="certificate"     tone="success"  colors={colors} />
          <StatCard label="Taux auth."    value={`${authRate}%`}   icon="check-circle"    tone="success"  colors={colors} />
          <StatCard label="Suspects"      value={suspects}         icon="alert-circle"    tone="danger"   colors={colors} />
          <StatCard label="Attente DGMR"  value={pendingVal}       icon="clock-outline"   tone="warning"  colors={colors} />
        </View>
      </AnimatedEntrance>

      {/* Distribution minéraux */}
      <AnimatedEntrance delay={110}>
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Distribution minéraux</Text>
          {[
            { label: 'Cuivre', count: copperCount, color: '#c9a84c', icon: 'circle' },
            { label: 'Cobalt', count: cobaltCount, color: colors.brand, icon: 'circle' },
            { label: 'Mixte',  count: mixedCount,  color: colors.muted, icon: 'circle' },
          ].map((item) => (
            <View key={item.label} style={styles.distRow}>
              <MaterialCommunityIcons name="circle" size={10} color={item.color} />
              <Text style={[styles.distLabel, { color: colors.muted }]}>{item.label}</Text>
              <View style={[styles.distTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.distFill, {
                  backgroundColor: item.color,
                  width: totalLots > 0 ? `${Math.round((item.count / totalLots) * 100)}%` : '0%',
                }]} />
              </View>
              <Text style={[styles.distCount, { color: colors.text }]}>{item.count}</Text>
            </View>
          ))}
        </View>
      </AnimatedEntrance>

      {/* Actions rapides */}
      <AnimatedEntrance delay={140}>
        <View style={styles.actionsRow}>
          <Pressable onPress={onOpenCertification} style={[styles.actionBtn, { backgroundColor: colors.brand }]}>
            <MaterialCommunityIcons name="plus-circle" size={20} color="#ffffff" />
            <Text style={styles.actionBtnText}>Certifier un lot</Text>
          </Pressable>
          <Pressable onPress={onOpenLots} style={[styles.actionBtnOutline, { borderColor: colors.border, backgroundColor: colors.cardAlt }]}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color={colors.text} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.text }]}>Mes lots</Text>
          </Pressable>
        </View>
      </AnimatedEntrance>

      {/* Lots récents */}
      {recentLots.length > 0 && (
        <AnimatedEntrance delay={170}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Lots récents</Text>
              <Pressable onPress={onOpenLots}>
                <Text style={[styles.seeAll, { color: colors.brand }]}>Voir tout</Text>
              </Pressable>
            </View>
            {recentLots.map((lot) => (
              <View key={lot.id} style={[styles.lotRow, { borderColor: colors.border }]}>
                <View style={styles.lotMain}>
                  <Text style={[styles.lotId, { color: colors.text }]} numberOfLines={1}>{lot.id}</Text>
                  <View style={styles.lotMeta}>
                    <MineralBadge type={lot.mineralType} colors={colors} />
                    <StatusBadge status={lot.status} colors={colors} />
                    {lot.tokenId != null && (
                      <View style={[styles.tokenBadge, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                        <MaterialCommunityIcons name="hexagon-outline" size={11} color={colors.successText} />
                        <Text style={[styles.tokenText, { color: colors.successText }]}>#{lot.tokenId}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.lotRight}>
                  <Text style={[styles.lotSite, { color: colors.muted }]}>{lot.site}</Text>
                  {lot.confidence != null && <ConfidenceBar value={lot.confidence} colors={colors} />}
                </View>
              </View>
            ))}
          </View>
        </AnimatedEntrance>
      )}

      {lots.length === 0 && (
        <AnimatedEntrance delay={100}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="pickaxe" size={32} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun lot</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Soumettez votre premier lot pour démarrer.</Text>
            <Pressable onPress={onOpenCertification} style={[styles.actionBtn, { backgroundColor: colors.brand, marginTop: 8 }]}>
              <MaterialCommunityIcons name="plus-circle" size={18} color="#ffffff" />
              <Text style={styles.actionBtnText}>Certifier un lot</Text>
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
  alertBox: {
    borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  alertText: { fontSize: 13, fontWeight: '700', flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    borderRadius: 20, borderWidth: 1, gap: 4,
    minWidth: '30%', flex: 1, padding: 14, alignItems: 'flex-start',
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  panel: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 16, fontWeight: '900' },
  seeAll: { fontSize: 13, fontWeight: '700' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distLabel: { fontSize: 12, width: 50 },
  distTrack: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  distFill: { height: 6, borderRadius: 999 },
  distCount: { fontSize: 12, fontWeight: '800', width: 24, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 18, paddingVertical: 14,
  },
  actionBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 18, borderWidth: 1, paddingVertical: 14,
  },
  actionBtnOutlineText: { fontSize: 14, fontWeight: '800' },
  lotRow: {
    borderBottomWidth: 1, paddingVertical: 12,
    flexDirection: 'row', gap: 10, justifyContent: 'space-between',
  },
  lotMain: { flex: 1, gap: 6 },
  lotId: { fontSize: 13, fontWeight: '800' },
  lotMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  lotRight: { alignItems: 'flex-end', gap: 4, minWidth: 80 },
  lotSite: { fontSize: 11 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  mineralBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  mineralText: { fontSize: 10, fontWeight: '700' },
  tokenBadge: {
    borderRadius: 999, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  tokenText: { fontSize: 10, fontWeight: '800' },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confTrack: { width: 50, height: 4, borderRadius: 999, overflow: 'hidden' },
  confFill: { height: 4, borderRadius: 999 },
  confText: { fontSize: 11, fontWeight: '700' },
  empty: {
    alignItems: 'center', borderRadius: 22, borderWidth: 1, gap: 8, padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
