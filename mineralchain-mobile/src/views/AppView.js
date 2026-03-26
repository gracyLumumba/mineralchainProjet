import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { ROUTES } from '../navigation/routes';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import LotsListScreen from './screens/LotsListScreen';
import LotDetailScreen from './screens/LotDetailScreen';
import CertificationScreen from './screens/CertificationScreen';

const Stack = createNativeStackNavigator();

export default function AppView() {
  const [session, setSession] = useState(null);
  const dashboard = useDashboardViewModel();

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
            {() => <LoginScreen onLogin={setSession} />}
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
