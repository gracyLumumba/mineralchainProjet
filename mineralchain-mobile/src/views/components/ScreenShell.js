import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

export default function ScreenShell({
  children,
  onRefresh,
  refreshing = false,
  keyboardShouldPersistTaps = 'handled',
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d6b57" />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#efe6d5',
  },
  bgOrbOne: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#d7b487',
    opacity: 0.22,
  },
  bgOrbTwo: {
    position: 'absolute',
    bottom: 110,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#9fc3b3',
    opacity: 0.18,
  },
  content: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
  },
});
