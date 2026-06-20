import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="perk/[id]" options={{ headerShown: true, title: 'Perk Details', headerBackTitle: 'Back' }} />
          <Stack.Screen name="redeem/[id]" options={{ headerShown: true, title: 'Your QR Code', headerBackTitle: 'Back' }} />
          <Stack.Screen name="life-moments/index" options={{ headerShown: true, title: 'Life Moments', headerBackTitle: 'Back' }} />
          <Stack.Screen name="life-moments/new" options={{ headerShown: true, title: 'Mark Life Event', headerBackTitle: 'Back' }} />
          <Stack.Screen name="life-moments/care-package" options={{ headerShown: true, title: 'Care Package', headerBackTitle: 'Back' }} />
          <Stack.Screen name="life-moments/donate" options={{ headerShown: true, title: 'Send Care Credits', headerBackTitle: 'Back' }} />
          <Stack.Screen name="request/new" options={{ headerShown: true, title: 'Request a Perk', headerBackTitle: 'Back' }} />
          <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/index" options={{ headerShown: false }} />
          <Stack.Screen name="challenges/[id]" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
