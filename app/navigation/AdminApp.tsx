import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { AdminHostVerificationsScreen } from '../screens/AdminHostVerificationsScreen';
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
      <Stack.Screen
        name="AdminHome"
        component={AdminHostVerificationsScreen}
        options={{ title: 'Host verifications' }}
      />
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

  if (isLoading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#5DD3B6" />
      </View>
    );
  }

  return user ? (
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
