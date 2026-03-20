import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminHostVerificationsScreen } from '../screens/AdminHostVerificationsScreen';
import { AdminListingTransfersScreen } from '../screens/AdminListingTransfersScreen';
import { AdminListingsPendingScreen } from '../screens/AdminListingsPendingScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminBookingsScreen } from '../screens/AdminBookingsScreen';
import { AdminFinanceScreen } from '../screens/AdminFinanceScreen';
import { AdminReportsScreen } from '../screens/AdminReportsScreen';
import { AdminAuditLogsScreen } from '../screens/AdminAuditLogsScreen';
import { AdminSettingsScreen } from '../screens/AdminSettingsScreen';
import { AdminSignupScreen } from '../screens/AdminSignupScreen';
import { AdminLoginScreen } from '../screens/AdminLoginScreen';
import { AdminVerifyEmailScreen } from '../screens/AdminVerifyEmailScreen';
import { AdminNavBar } from '../components/AdminNavBar';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: true,
  header: ({ route, navigation }: { route: any; navigation: any }) => (
    <AdminNavBar
      title={route.options?.title ?? route.name}
      showBackButton={navigation.canGoBack()}
      onBack={() => navigation.goBack()}
    />
  ),
};

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminHome" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="AdminListingsPending" component={AdminListingsPendingScreen} options={{ title: 'Pending listings' }} />
      <Stack.Screen name="AdminHostVerifications" component={AdminHostVerificationsScreen} options={{ title: 'Host verifications' }} />
      <Stack.Screen name="AdminListingTransfers" component={AdminListingTransfersScreen} options={{ title: 'Listing transfers' }} />
      <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} options={{ title: 'Bookings' }} />
      <Stack.Screen name="AdminFinance" component={AdminFinanceScreen} options={{ title: 'Finance' }} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="AdminAuditLogs" component={AdminAuditLogsScreen} options={{ title: 'Audit logs' }} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="AdminSignup" component={AdminSignupScreen} options={{ title: 'Create admin' }} />
      <Stack.Screen name="Login" component={AdminLoginScreen} options={{ title: 'Log in' }} />
    </Stack.Navigator>
  );
}

function LoginStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={AdminLoginScreen} options={{ title: 'Log in' }} />
      <Stack.Screen name="VerifyEmail" component={AdminVerifyEmailScreen} options={{ title: 'Verify email' }} />
      <Stack.Screen name="AdminSignup" component={AdminSignupScreen} options={{ title: 'Create admin' }} />
    </Stack.Navigator>
  );
}

export function AdminApp() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const isAdmin = !!user && user.role?.toLowerCase().startsWith('admin');

  if (isLoading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#5DD3B6" />
      </View>
    );
  }

  return isAdmin ? (
    <AdminStack key={`auth-${user.id}`} />
  ) : (
    <LoginStack key="guest" />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
