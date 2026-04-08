import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import LotCard from '../components/LotCard';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';
import { filterLotsByWorkflow, getRoleLotFilters } from '../../models/roleInsights';

function getRoleTitle(role) {
  if (role === 'admin') return 'Registre global';
  if (role === 'regulator') return 'Registre regulatoire';
  if (role === 'transporter') return 'Registre transport';
  return 'Mes lots';
}

export default function LotsListScreen({ session, lots, isRefreshing, refresh, onOpenLot }) {
  const [query, setQuery] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const { colors, t } = usePreferences();
  const filters = useMemo(() => getRoleLotFilters(session?.role), [session?.role]);

  const filteredLots = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const workflowLots = filterLotsByWorkflow(lots, session?.role, filterKey);

    if (!normalized) {
      return workflowLots;
    }

    return workflowLots.filter((lot) =>
      [
        lot.id,
        lot.site,
        lot.status,
        lot.storage,
        lot.transportStatus,
        lot.ownerName,
        lot.ownerUsername,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [lots, query, filterKey, session?.role]);

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <AnimatedEntrance delay={0}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('inventory')}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{getRoleTitle(session?.role)}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{t('lot_subtitle')}</Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.searchLabel, { color: colors.text }]}>{t('search_lot')}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search_lot_placeholder')}
            placeholderTextColor={colors.muted}
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.input,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const active = filter.key === filterKey;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setFilterKey(filter.key)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? colors.brand : colors.cardAlt,
                      borderColor: active ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.filterText, { color: active ? '#ffffff' : colors.text }]}>{filter.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.resultCount, { color: colors.muted }]}>
            {filteredLots.length} / {lots.length} {t('lots').toLowerCase()}
          </Text>
        </View>
      </AnimatedEntrance>

      {filteredLots.length ? (
        filteredLots.map((lot, index) => (
          <AnimatedEntrance key={lot.id} delay={70 + index * 45}>
            <Pressable onPress={() => onOpenLot(lot.id)}>
              <LotCard lot={lot} />
            </Pressable>
          </AnimatedEntrance>
        ))
      ) : (
        <AnimatedEntrance delay={70}>
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {query.trim() ? t('no_search_result') : t('no_lot')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {query.trim() ? t('adjust_search') : t('no_data')}
            </Text>
          </View>
        </AnimatedEntrance>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  searchInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  resultCount: {
    fontSize: 13,
  },
  empty: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
  },
});
