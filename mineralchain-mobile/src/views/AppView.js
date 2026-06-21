import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { ROUTES } from '../navigation/routes';
import { PreferencesProvider, usePreferences } from '../contexts/PreferencesContext';
import { clearSession, loadSession, saveSession } from '../services/storage/sessionStorage';
import RegulatorScreen from './screens/RegulatorScreen';
import RegulatorDashboardScreen from './screens/RegulatorDashboardScreen';
import RegulatorAnalysisScreen from './screens/RegulatorAnalysisScreen';
import RegulatorAlertsScreen from './screens/RegulatorAlertsScreen';
import RegulatorLotsScreen from './screens/RegulatorLotsScreen';
import ProducerScreen from './screens/ProducerScreen';
import ProducerMenuScreen from './screens/ProducerMenuScreen';
import TransporterMenuScreen from './screens/TransporterMenuScreen';
import TransporterScannerScreen from './screens/TransporterScannerScreen';
import AdminMenuScreen from './screens/AdminMenuScreen';
import AdminTransactionsScreen from './screens/AdminTransactionsScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import LotsListScreen from './screens/LotsListScreen';
import LotDetailScreen from './screens/LotDetailScreen';
import CertificationScreen from './screens/CertificationScreen';

const Stack = createNativeStackNavigator();

function BootScreen() {
  const { colors, t } = usePreferences();
  return (
    <View style={[styles.bootScreen, { backgroundColor: colors.screen }]}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={[styles.bootText, { color: colors.muted }]}>{t('opening')}</Text>
    </View>
  );
}

function AppNavigator() {
  const [session, setSession] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const dashboard = useDashboardViewModel(session);
  const { colors, ready, theme } = usePreferences();
  const canCertify = session?.role === 'producer';
  const isRegulator = session?.role === 'regulator';
  const isProducer = session?.role === 'producer';
  const isTransporter = session?.role === 'transporter';
  const isAdmin = session?.role === 'admin';

  useEffect(() => {
    let active = true;

    const restore = async () => {
      try {
        const storedSession = await loadSession();
        if (active && storedSession) {
          setSession(storedSession);
        }
      } finally {
        if (active) {
          setIsBooting(false);
        }
      }
    };

    restore();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (nextSession) => {
    setSession(nextSession);
    await saveSession(nextSession);
  };

  const handleLogout = async () => {
    setSession(null);
    await clearSession();
  };

  if (!ready || isBooting) {
    return (
        <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <BootScreen />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName={session ? ROUTES.DASHBOARD : ROUTES.LOGIN}
        screenOptions={{
          animation: 'fade_from_bottom',
          headerStyle: {
            backgroundColor: colors.screen,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: {
            backgroundColor: colors.screen,
          },
        }}
      >
        {!session ? (
          <Stack.Screen name={ROUTES.LOGIN} options={{ headerShown: false }}>
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name={ROUTES.DASHBOARD} options={{ title: 'Accueil' }}>
              {({ navigation }) => (
                <DashboardScreen
                  session={session}
                  health={dashboard.health}
                  lots={dashboard.lots}
                  users={dashboard.users}
                  isLoading={dashboard.isLoading}
                  isRefreshing={dashboard.isRefreshing}
                  isMutatingUsers={dashboard.isMutatingUsers}
                  error={dashboard.error}
                  refresh={dashboard.refresh}
                  onApproveUser={dashboard.approveUser}
                  onRejectUser={dashboard.rejectUser}
                  onRevokeUser={dashboard.revokeUser}
                  onLogout={handleLogout}
                  onNavigate={(route) => navigation.navigate(route)}
                  onOpenLots={() => navigation.navigate(ROUTES.LOTS)}
                  onOpenCertification={() => {
                    if (canCertify) navigation.navigate(ROUTES.PRODUCER_MENU);
                    else if (isRegulator) navigation.navigate(ROUTES.REGULATOR);
                    else if (isTransporter) navigation.navigate(ROUTES.TRANSPORTER_MENU);
                    else if (isAdmin) navigation.navigate(ROUTES.ADMIN_MENU);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.LOTS} options={{ title: 'Lots' }}>
              {({ navigation }) => (
                <LotsListScreen
                  session={session}
                  lots={dashboard.lots}
                  isRefreshing={dashboard.isRefreshing}
                  refresh={dashboard.refresh}
                  onOpenLot={(lotId) =>
                    navigation.navigate(ROUTES.LOT_DETAIL, { lotId, session })
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.LOT_DETAIL} options={{ title: 'Detail lot' }}>
              {({ route }) => <LotDetailScreen route={route} />}
            </Stack.Screen>
            {isProducer ? (
              <>
                <Stack.Screen name={ROUTES.PRODUCER_MENU} options={{ title: 'Menu Production' }}>
                  {({ navigation }) => (
                    <ProducerMenuScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                      onNavigate={(route) => navigation.navigate(route)}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name={ROUTES.PRODUCER} options={{ title: 'Dashboard' }}>
                  {({ navigation }) => (
                    <ProducerScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                      onOpenCertification={() => navigation.navigate(ROUTES.CERTIFY)}
                      onOpenLots={() => navigation.navigate(ROUTES.LOTS)}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : null}
            {canCertify ? (
              <Stack.Screen name={ROUTES.CERTIFY} options={{ title: 'Certification' }}>
                {({ navigation }) => (
                  <CertificationScreen
                    session={session}
                    onCertified={() => {
                      dashboard.refresh();
                      navigation.navigate(ROUTES.PRODUCER);
                    }}
                  />
                )}
              </Stack.Screen>
            ) : null}
            {isRegulator ? (
              <>
                <Stack.Screen name={ROUTES.REGULATOR} options={{ title: 'Supervision DGMR' }}>
                  {({ navigation }) => (
                    <RegulatorScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                      onNavigate={(route) => navigation.navigate(route)}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name={ROUTES.REGULATOR_DASHBOARD} options={{ title: 'Dashboard' }}>
                  {() => (
                    <RegulatorDashboardScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name={ROUTES.REGULATOR_ANALYSIS} options={{ title: 'Analyse' }}>
                  {() => (
                    <RegulatorAnalysisScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name={ROUTES.REGULATOR_ALERTS} options={{ title: 'Alertes' }}>
                  {() => (
                    <RegulatorAlertsScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name={ROUTES.REGULATOR_LOTS} options={{ title: 'Tous les lots' }}>
                  {() => (
                    <RegulatorLotsScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : null}
            {isTransporter ? (
              <>
                <Stack.Screen name={ROUTES.TRANSPORTER_MENU} options={{ title: 'Menu Transport' }}>
                  {({ navigation }) => (
                    <TransporterMenuScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                      onNavigate={(route) => navigation.navigate(route)}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name={ROUTES.TRANSPORTER_SCANNER} options={{ title: 'Scanner QR' }}>
                  {({ navigation }) => (
                    <TransporterScannerScreen
                      lots={dashboard.lots}
                      isRefreshing={dashboard.isRefreshing}
                      refresh={dashboard.refresh}
                      onOpenLot={(lotId) => navigation.navigate(ROUTES.LOT_DETAIL, { lotId, session })}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : null}
            {isAdmin ? (
              <Stack.Screen name={ROUTES.ADMIN_MENU} options={{ title: 'Menu Admin' }}>
                {({ navigation }) => (
                  <AdminMenuScreen
                    lots={dashboard.lots}
                    users={dashboard.users}
                    isRefreshing={dashboard.isRefreshing}
                    refresh={dashboard.refresh}
                    onNavigate={(route) => navigation.navigate(route)}
                  />
                )}
              </Stack.Screen>
            ) : null}
            {isAdmin ? (
              <Stack.Screen name={ROUTES.TRANSACTIONS} options={{ title: 'Transactions' }}>
                {({ navigation }) => (
                  <AdminTransactionsScreen
                    isRefreshing={dashboard.isRefreshing}
                    refresh={dashboard.refresh}
                    onNavigate={(route) => navigation.navigate(route)}
                  />
                )}
              </Stack.Screen>
            ) : null}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppView() {
  return (
    <PreferencesProvider>
      <AppNavigator />
    </PreferencesProvider>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  bootText: {
    fontSize: 14,
  },
});
