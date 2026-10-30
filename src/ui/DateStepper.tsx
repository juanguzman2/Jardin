import { StyleSheet, View } from 'react-native';

import { es } from '../copy/es';
import { addDays, today as todayFn } from '../domain/dates';
import { IconButton } from './Button';
import { formatDayLong, relativeDayLabel } from './format';
import { ChevronIcon } from './icons';
import { T } from './Text';
import { radius, spacing, useTheme } from './theme';

/** Elegir una fecha con flechas (sin escribir). `max` limita hacia adelante (p. ej. hoy). */
export function DateStepper({
  value,
  onChange,
  max,
  min,
  label,
}: {
  value: string;
  onChange: (day: string) => void;
  max?: string;
  min?: string;
  label: string;
}) {
  const { c } = useTheme();
  const today = todayFn();
  const relative = relativeDayLabel(value, today);
  const atMax = max !== undefined && value >= max;
  const atMin = min !== undefined && value <= min;
  return (
    <View style={styles.wrap}>
      <T style={styles.label}>{label}</T>
      <View style={[styles.row, { backgroundColor: c.cardAlt, borderColor: c.border }]}>
        <IconButton
          accessibilityLabel={`${label}: ${es.common.previousDay}`}
          onPress={() => onChange(addDays(value, -1))}
          disabled={atMin}
        >
          <ChevronIcon color={c.text} direction="left" />
        </IconButton>
        <View style={styles.center} accessible accessibilityLabel={`${label}: ${formatDayLong(value)}`}>
          <T style={styles.value}>{relative}</T>
          {relative === es.common.today || relative === es.common.yesterday ? (
            <T variant="small">{formatDayLong(value)}</T>
          ) : null}
        </View>
        <IconButton
          accessibilityLabel={`${label}: ${es.common.nextDay}`}
          onPress={() => onChange(addDays(value, 1))}
          disabled={atMax}
        >
          <ChevronIcon color={c.text} direction="right" />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  center: { flex: 1, alignItems: 'center' },
  value: { fontWeight: '600', fontSize: 17 },
});
