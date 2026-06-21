import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { fetchBlockchainTransactions } from '../../services/api/blockchainService';
import { isNetworkUnavailableError } from '../../services/api/client';

function shortenHash(value) {
  const raw = String(value || '');
  if (raw.length <= 14) return raw || '—';
  return `${raw.slice(0, 8)}…${raw.slice(-6)}`;
}

function StatCard({ label, value, icon, colors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.brand} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function TxRow({ tx, colors }) {
  return (
    <View style={[styles.txRow, { borderColor: colors.border }]}>
      <View style={styles.txMain}>
        <Text style={[styles.txHash, { color: colors.text }]} numberOfLines={1}>
          {shortenHash(tx.hash)}
        </Text>
        <Text style={[styles.txMeta, { color: colors.muted }]} numberOfLines={1}>
          Bloc #{tx.blockNumber ?? '—'} · {shortenHash(tx.from)}
        </Text>
        <Text style={[styles.txMeta, { color: colors.muted }]} numberOfLines={1}>
          Vers {shortenHash(tx.to)}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txValue, { color: colors.brand }]}>{tx.value}</Text>
        <Text style={[styles.txLabel, { color: colors.muted }]}>wei</Text>
      </View>
    </View>
  );
}

export default function AdminTransactionsScreen({ isRefreshing, refresh }) {
  const { colors } = usePreferences();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const next = await fetchBlockchainTransactions();
      setTransactions(next);
    } catch (loadError) {
      if (isNetworkUnavailableError(loadError)) {
        setError('Serveur injoignable pour les transactions blockchain.');
        return;
      }
      setError(loadError.message || 'Impossible de charger les transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const displayRefresh = async () => {
    if (typeof refresh === 'function') {
      await refresh();
    }
    await load();
  };

  return (
    <ScreenShell onRefresh={displayRefresh} refreshing={isRefreshing || isLoading}>
      <AnimatedEntrance delay={0}>
        <PageHeader />
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Blockchain · Transactions</Text>
          <Text style={[styles.title, { color: colors.text }]}>Journal des transactions</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Suivi des envois vers le smart contract sur les derniers blocs.
          </Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={70}>
        <View style={styles.statsGrid}>
          <StatCard label="Transactions" value={transactions.length} icon="swap-horizontal" colors={colors} />
          <StatCard label="Dernier bloc" value={transactions[0]?.blockNumber ?? '—'} icon="cube-outline" colors={colors} />
        </View>
      </AnimatedEntrance>

      {error ? (
        <AnimatedEntrance delay={90}>
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={colors.errorText} />
            <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
            <Pressable onPress={displayRefresh} style={[styles.retryButton, { backgroundColor: colors.ghostButton }]}>
              <Text style={[styles.retryText, { color: colors.ghostButtonText }]}>Reessayer</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      ) : null}

      {isLoading ? (
        <AnimatedEntrance delay={100}>
          <View style={[styles.loadingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement des transactions...</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      {!isLoading && transactions.length > 0 ? (
        <AnimatedEntrance delay={110}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {transactions.map((tx, index) => (
              <TxRow key={`${tx.hash}-${index}`} tx={tx} colors={colors} />
            ))}
          </View>
        </AnimatedEntrance>
      ) : null}

      {!isLoading && !error && transactions.length === 0 ? (
        <AnimatedEntrance delay={110}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="swap-horizontal" size={32} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune transaction</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Les nouvelles certifications apparaîtront ici après mint ou synchronisation.
            </Text>
          </View>
        </AnimatedEntrance>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    flex: 1,
    padding: 16,
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  errorText: { fontSize: 14, fontWeight: '700' },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loadingBox: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 24,
  },
  loadingText: { fontSize: 13, fontWeight: '700' },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  txRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  txMain: { flex: 1, gap: 4 },
  txHash: { fontSize: 13, fontWeight: '800' },
  txMeta: { fontSize: 12 },
  txRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  txValue: { fontSize: 14, fontWeight: '900' },
  txLabel: { fontSize: 11 },
  empty: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 36,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
