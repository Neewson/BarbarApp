import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="booking"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="appointment-detail"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="subscription"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
