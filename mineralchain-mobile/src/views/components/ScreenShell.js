import { DevSettings, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function ScreenShell({
  children,
  onRefresh,
  refreshing = false,
  keyboardShouldPersistTaps = 'handled',
}) {
  const { colors } = usePreferences();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screen }]}>
      <View style={[styles.bgOrbOne, { backgroundColor: colors.overlayOne }]} />
      <View style={[styles.bgOrbTwo, { backgroundColor: colors.overlayTwo }]} />

      {__DEV__ ? (
        <Pressable
          onPress={() => DevSettings.reload()}
          style={[styles.devReload, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}
        >
          <Text style={[styles.devReloadText, { color: colors.text }]}>Reload app</Text>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
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
  },
  bgOrbOne: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.22,
  },
  bgOrbTwo: {
    position: 'absolute',
    bottom: 110,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    opacity: 0.18,
  },
  devReload: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 5,
  },
  devReloadText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
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
