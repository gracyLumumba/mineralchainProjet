import { Pressable, StyleSheet, Text, View } from 'react-native';

const TABS = [
  { key: 'overview', label: 'Vue generale' },
  { key: 'lots', label: 'Lots' },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.row}>
      {TABS.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={[
            styles.tab,
            activeTab === tab.key ? styles.activeTab : null,
          ]}
        >
          <Text
            style={[
              styles.label,
              activeTab === tab.key ? styles.activeLabel : null,
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
    backgroundColor: '#e4dac7',
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: '#ffffff',
  },
  label: {
    color: '#725f44',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#17312d',
  },
});
