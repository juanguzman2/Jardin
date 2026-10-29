import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ChevronIcon } from './icons';
import { T } from './Text';
import { radius, spacing, useTheme } from './theme';

export function Card({ children, style, tone }: { children: ReactNode; style?: ViewStyle; tone?: 'warn' | 'soft' }) {
  const { c } = useTheme();
  const bg = tone === 'warn' ? c.warnSoft : tone === 'soft' ? c.primarySoft : c.card;
  return <View style={[styles.card, { backgroundColor: bg, borderColor: c.border }, style]}>{children}</View>;
}

/** Tarjeta plegable (apertura y cierre del día). */
export function Collapsible({
  title,
  subtitle,
  open: controlledOpen,
  defaultOpen = true,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  const { c } = useTheme();
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const toggle = () => {
    setLocalOpen(!open);
    onToggle?.(!open);
  };
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={styles.header}
      >
        <View style={styles.flex}>
          <T variant="heading">{title}</T>
          {subtitle ? <T variant="small">{subtitle}</T> : null}
        </View>
        <ChevronIcon color={c.muted} direction={open ? 'up' : 'down'} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <T variant="label">{children}</T>
      {right}
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 32 },
  flex: { flex: 1 },
  body: { gap: spacing.md },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});
