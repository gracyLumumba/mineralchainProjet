import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { ROUTES } from '../navigation/routes';
import { PreferencesProvider, usePreferences } from '../contexts/PreferencesContext';
import { clearSession, loadSession, saveSession } from '../services/storage/sessionStorage';
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
  const dashboard = useDashboardViewModel();
  const { colors, ready, theme } = usePreferences();

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
                  isLoading={dashboard.isLoading}
                  isRefreshing={dashboard.isRefreshing}
                  error={dashboard.error}
                  refresh={dashboard.refresh}
                  onLogout={handleLogout}
                  onOpenLots={() => navigation.navigate(ROUTES.LOTS)}
                  onOpenCertification={() => navigation.navigate(ROUTES.CERTIFY)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name={ROUTES.LOTS} options={{ title: 'Lots' }}>
              {({ navigation }) => (
                <LotsListScreen
                  lots={dashboard.lots}
                  isRefreshing={dashboard.isRefreshing}
                  refresh={dashboard.refresh}
                  onOpenLot={(lotId) =>
                    navigation.navigate(ROUTES.LOT_DETAIL, { lotId })
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name={ROUTES.LOT_DETAIL}
              component={LotDetailScreen}
              options={{ title: 'Detail lot' }}
            />
            <Stack.Screen name={ROUTES.CERTIFY} options={{ title: 'Certification' }}>
              {() => <CertificationScreen session={session} />}
            </Stack.Screen>
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
