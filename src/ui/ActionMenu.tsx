import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { es } from '../copy/es';
import { T } from './Text';
import { radius, spacing, touch, useTheme } from './theme';

export interface MenuAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/** Menú simple de acciones (editar, borrar…) que funciona igual en Android y en web. */
export function ActionMenu({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: MenuAction[];
  onClose: () => void;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: c.card }]}>
          {title ? (
            <T variant="small" style={styles.title} numberOfLines={2}>
              {title}
            </T>
          ) : null}
          {actions.map((a) => (
            <Pressable
              key={a.label}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                a.onPress();
              }}
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.6 : 1, borderTopColor: c.border }]}
            >
              <T color={a.destructive ? c.away : c.text} style={styles.itemText}>
                {a.label}
              </T>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.6 : 1, borderTopColor: c.border }]}
          >
            <T color={c.muted} style={styles.itemText}>
              {es.common.cancel}
            </T>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg },
  sheet: { borderRadius: radius.lg, overflow: 'hidden', paddingTop: spacing.sm },
  title: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  item: { minHeight: touch + 4, justifyContent: 'center', paddingHorizontal: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  itemText: { fontSize: 17 },
});
