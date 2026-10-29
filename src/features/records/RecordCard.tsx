import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import type { FunctionalRecord } from '../../db/schema';
import { isoToBogota } from '../../domain/dates';
import { formatMoment } from '../../ui/format';
import { T } from '../../ui/Text';
import { radius, spacing, useTheme } from '../../ui/theme';

/** Fila de un auto-registro (lista, pendientes y detalle de regla). */
export function RecordRow({
  record,
  areaName,
  ruleThought,
  showDate = false,
  action,
}: {
  record: FunctionalRecord;
  areaName?: string | null;
  ruleThought?: string | null;
  showDate?: boolean;
  action?: string;
}) {
  const { c } = useTheme();
  const when = showDate ? formatMoment(record.occurredAt) : isoToBogota(record.occurredAt).time;
  const hasIntensity = record.intensityBefore !== null || record.intensityAfter !== null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${when} ${record.context}`}
      onPress={() => router.push({ pathname: '/record/[id]', params: { id: record.id } })}
      style={({ pressed }) => [styles.row, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={styles.top}>
        <T variant="small" style={styles.when}>
          {when}
        </T>
        {hasIntensity ? (
          <T variant="small" style={styles.intensity}>
            {es.records.intensityArrow(record.intensityBefore, record.intensityAfter)}
          </T>
        ) : null}
      </View>
      <T numberOfLines={3}>{record.context}</T>
      {areaName || ruleThought ? (
        <T variant="small" numberOfLines={1}>
          {[areaName, ruleThought ? `“${ruleThought}”` : null].filter(Boolean).join(' · ')}
        </T>
      ) : null}
      {action ? (
        <T variant="small" color={c.primary} style={styles.action}>
          {action} →
        </T>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  when: { fontWeight: '600' },
  intensity: { fontVariant: ['tabular-nums'] },
  action: { fontWeight: '600' },
});
