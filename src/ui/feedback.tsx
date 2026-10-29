import { useEffect } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { es } from '../copy/es';
import { T } from './Text';
import { radius, spacing, useTheme } from './theme';

/** Confirmación antes de borrar o reemplazar datos. */
export function confirm(options: {
  title?: string;
  message?: string;
  confirmLabel?: string;
}): Promise<boolean> {
  const title = options.title ?? es.common.confirmDeleteTitle;
  const message = options.message ?? es.common.confirmDeleteBody;
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: es.common.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: options.confirmLabel ?? es.common.delete, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/* Avisos breves dentro de la app. */

const useToast = create<{ message: string | null; id: number }>(() => ({ message: null, id: 0 }));

export function toast(message: string): void {
  useToast.setState((s) => ({ message, id: s.id + 1 }));
}

export function ToastHost() {
  const { message, id } = useToast();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => useToast.setState({ message: null }), 2600);
    return () => clearTimeout(t);
  }, [id, message]);
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.toastWrap, { bottom: insets.bottom + 90 }]}>
      <View accessibilityLiveRegion="polite" style={[styles.toast, { backgroundColor: c.text }]}>
        <T color={c.bg}>{message}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  toast: { borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxWidth: 480 },
});
