import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { T } from './Text';
import { radius, spacing, touch, useTheme } from './theme';

type Kind = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  kind?: Kind;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  small?: boolean;
  accessibilityLabel?: string;
}

export function Button({ label, onPress, kind = 'primary', disabled, loading, icon, style, small, accessibilityLabel }: ButtonProps) {
  const { c } = useTheme();
  const bg = kind === 'primary' ? c.primary : kind === 'secondary' ? c.primarySoft : 'transparent';
  const fg = kind === 'primary' ? c.primaryText : c.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        kind === 'ghost' && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <T style={[styles.label, small && styles.smallLabel]} color={fg}>
            {label}
          </T>
        </View>
      )}
    </Pressable>
  );
}

/** Botón circular de ícono (encabezados, flechas). */
export function IconButton({
  onPress,
  children,
  accessibilityLabel,
  disabled,
}: {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [styles.icon, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 40, paddingHorizontal: spacing.md },
  ghost: { paddingHorizontal: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontWeight: '600', fontSize: 16 },
  smallLabel: { fontSize: 15 },
  icon: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
});
