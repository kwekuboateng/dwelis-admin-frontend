import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { AdminApp } from './navigation/AdminApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: '#5DD3B6',
              background: '#f9fafb',
              card: '#ffffff',
              text: '#111827',
              border: '#e5e7eb',
              notification: '#10b981',
            },
          }}
        >
          <View style={styles.appContainer}>
            <AdminApp />
          </View>
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
