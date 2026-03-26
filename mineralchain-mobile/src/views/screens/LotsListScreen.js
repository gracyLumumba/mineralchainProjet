import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import LotCard from '../components/LotCard';
import AnimatedEntrance from '../components/AnimatedEntrance';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function LotsListScreen({ lots, onOpenLot }) {
  const { t } = usePreferences();
  return (
    <ScreenShell>
      <AnimatedEntrance delay={0}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('inventory')}</Text>
          <Text style={styles.title}>{t('lots')}</Text>
          <Text style={styles.subtitle}>{t('lot_subtitle')}</Text>
        </View>
      </AnimatedEntrance>

      {lots.length ? (
        lots.map((lot, index) => (
          <AnimatedEntrance key={lot.id} delay={70 + index * 45}>
            <Pressable onPress={() => onOpenLot(lot.id)}>
              <LotCard lot={lot} />
            </Pressable>
          </AnimatedEntrance>
        ))
      ) : (
        <AnimatedEntrance delay={70}>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('no_lot')}</Text>
            <Text style={styles.emptyText}>{t('no_data')}</Text>
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
  empty: {
    backgroundColor: '#fcf8ef',
    borderColor: '#dfcfb6',
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  emptyTitle: {
    color: '#1d2c2b',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#516160',
    fontSize: 14,
  },
});
