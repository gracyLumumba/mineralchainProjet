import { useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { usePreferences } from '../../contexts/PreferencesContext';
import DrawerMenu from './DrawerMenu';

export default function ScreenShell({
  children,
  onRefresh,
  refreshing = false,
  keyboardShouldPersistTaps = 'handled',
  session,
  onNavigate,
  onLogout,
}) {
  const { colors } = usePreferences();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.screen }]}>
      <View style={[styles.bgOrbOne, { backgroundColor: colors.overlayOne }]} />
      <View style={[styles.bgOrbTwo, { backgroundColor: colors.overlayTwo }]} />

      {session && onNavigate && onLogout ? (
        <DrawerMenu
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNavigate={onNavigate}
          onLogout={onLogout}
          session={session}
        />
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
        <View style={styles.inner}>
          {typeof children === 'function'
            ? children({ onOpenMenu: () => setDrawerOpen(true) })
            : children}
        </View>
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
