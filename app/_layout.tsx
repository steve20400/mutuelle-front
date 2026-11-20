import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '@/src/lib/queryClient';
import { useAuthStore } from '@/src/store/authStore';
import { useContextStore } from '@/src/store/contextStore';
import { ToastProvider } from '@/src/components/common/ToastProvider';
import { GlobalLoader } from '@/src/components/common/Loader';
import { NetworkBanner } from '@/src/components/common/NetworkBanner';
import { AnimatedSplash } from '@/src/components/common/AnimatedSplash';
import { NotificationProvider } from '@/src/providers/NotificationProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
        // Sur redémarrage à chaud (token existant), le contexte n'est pas
        // chargé par initialize(). On le charge ici pendant le splash pour
        // qu'il soit disponible dès que l'utilisateur passe le PIN.
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await useContextStore.getState().fetchContext();
        }
      } catch {
        // silent — les erreurs réseau sont gérées dans chaque store
      } finally {
        await SplashScreen.hideAsync();
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="inscription" options={{ headerShown: false }} />
              <Stack.Screen name="solidarite"  options={{ headerShown: false }} />
            </Stack>

            <ToastProvider />
            <GlobalLoader />

            {appReady && !splashDone && (
              <AnimatedSplash onDone={() => setSplashDone(true)} />
            )}
            <NetworkBanner />
          </NotificationProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
