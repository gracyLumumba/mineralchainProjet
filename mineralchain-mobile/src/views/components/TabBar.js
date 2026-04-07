import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

const TABS = [
  { key: 'overview', label: 'Vue generale' },
  { key: 'lots', label: 'Lots' },
];

export default function TabBar({ activeTab, onChange }) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.row, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={[
            styles.tab,
            activeTab === tab.key ? [styles.activeTab, { backgroundColor: colors.input }] : null,
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: activeTab === tab.key ? colors.text : colors.muted },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  activeTab: {},
  label: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
