import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { ROUTES } from '../navigation/routes';
import { clearSession, loadSession, saveSession } from '../services/storage/sessionStorage';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import LotsListScreen from './screens/LotsListScreen';
import LotDetailScreen from './screens/LotDetailScreen';
import CertificationScreen from './screens/CertificationScreen';

const Stack = createNativeStackNavigator();

function BootScreen() {
  return (
    <View style={styles.bootScreen}>
      <ActivityIndicator size="large" color="#1d6b57" />
      <Text style={styles.bootText}>Ouverture...</Text>
    </View>
  );
}

export default function AppView() {
  const [session, setSession] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const dashboard = useDashboardViewModel();

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

  if (isBooting) {
    return (
      <>
        <StatusBar style="dark" />
        <BootScreen />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={session ? ROUTES.DASHBOARD : ROUTES.LOGIN}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f3efe5',
          },
          headerShadowVisible: false,
          headerTintColor: '#17312d',
          contentStyle: {
            backgroundColor: '#f3efe5',
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

const styles = StyleSheet.create({
  bootScreen: {
    alignItems: 'center',
    backgroundColor: '#f3efe5',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  bootText: {
    color: '#516160',
    fontSize: 14,
  },
});
