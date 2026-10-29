import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlusIcon } from './icons';
import { T } from './Text';
import { radius, spacing, useTheme } from './theme';

export interface FabOption {
  label: string;
  onPress: () => void;
}

/** Botón flotante "+" que despliega opciones. */
export function Fab({ options, accessibilityLabel }: { options: FabOption[]; accessibilityLabel: string }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: c.primary, bottom: spacing.lg, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <PlusIcon color={c.primaryText} size={28} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={() => setOpen(false)}>
          <View style={[styles.options, { paddingBottom: insets.bottom + spacing.lg + 72 }]}>
            {options.map((o) => (
              <Pressable
                key={o.label}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  o.onPress();
                }}
                style={({ pressed }) => [styles.option, { backgroundColor: c.card, opacity: pressed ? 0.8 : 1 }]}
              >
                <T style={styles.optionText}>{o.label}</T>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  options: { alignItems: 'flex-end', paddingHorizontal: spacing.lg, gap: spacing.md },
  option: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    justifyContent: 'center',
    elevation: 3,
  },
  optionText: { fontSize: 17, fontWeight: '600' },
});
