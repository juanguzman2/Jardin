import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { es } from '../src/copy/es';
import { openDatabase } from '../src/db/client';
import { seedDatabase } from '../src/db/seed';
import {
  configureNotificationHandler,
  handleNotificationResponse,
  notificationsSupported,
  syncHabitReminders,
} from '../src/notifications';
import { ToastHost } from '../src/ui/feedback';
import { T } from '../src/ui/Text';
import { spacing, useTheme } from '../src/ui/theme';

configureNotificationHandler();

/** Botones "Hecho"/"Mínimo" de las notificaciones, también si abrieron la app. */
function useNotificationResponses(ready: boolean) {
  useEffect(() => {
    if (!ready || !notificationsSupported) return;
    const process = (response: Notifications.NotificationResponse) => {
      const result = handleNotificationResponse(response);
      if (result === 'opened') router.navigate('/habits');
      Notifications.clearLastNotificationResponse();
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) process(last);
    const sub = Notifications.addNotificationResponseReceivedListener(process);
    return () => sub.remove();
  }, [ready]);
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { c, dark } = useTheme();

  useEffect(() => {
    openDatabase()
      .then(() => {
        seedDatabase();
        setReady(true);
        // Al abrir la app, verificar que todos los recordatorios estén programados.
        syncHabitReminders().catch(() => undefined);
      })
      .catch((e: unknown) => {
        console.error('openDatabase', e, (e as { cause?: unknown })?.cause);
        setError(e instanceof Error ? e : new Error(String(e)));
      });
  }, []);

  useNotificationResponses(ready);

  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: c.primary, background: c.bg, card: c.card, text: c.text, border: c.border },
    };
  }, [c, dark]);

  let content;
  if (error) {
    content = (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <T variant="heading">{es.common.dbError}</T>
        <T variant="small">{error.message}</T>
      </View>
    );
  } else if (!ready) {
    content = (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} />
        <T variant="muted">{es.common.loading}</T>
      </View>
    );
  } else {
    content = (
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: es.settings.title }} />
        <Stack.Screen name="export-pdf" options={{ title: es.pdf.screenTitle }} />
      </Stack>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {content}
        <ToastHost />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
});
