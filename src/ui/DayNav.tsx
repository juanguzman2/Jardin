import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../copy/es';
import { addDays } from '../domain/dates';
import { IconButton } from './Button';
import { relativeDayLabel } from './format';
import { ChevronIcon } from './icons';
import { T } from './Text';
import { spacing, useTheme } from './theme';

/** Navegación entre días. No permite ir más allá de hoy. */
export function DayNav({ day, today, onChange }: { day: string; today: string; onChange: (day: string) => void }) {
  const { c } = useTheme();
  const isToday = day === today;
  return (
    <View style={styles.row}>
      <IconButton accessibilityLabel={es.common.previousDay} onPress={() => onChange(addDays(day, -1))}>
        <ChevronIcon color={c.text} direction="left" />
      </IconButton>
      <Pressable
        style={styles.center}
        onPress={() => onChange(today)}
        accessibilityRole="button"
        accessibilityLabel={es.common.goToday}
        disabled={isToday}
      >
        <T variant="heading" style={styles.label}>
          {relativeDayLabel(day, today)}
        </T>
        {!isToday ? (
          <T variant="small" color={c.primary}>
            {es.common.goToday}
          </T>
        ) : null}
      </Pressable>
      <IconButton
        accessibilityLabel={es.common.nextDay}
        onPress={() => onChange(addDays(day, 1))}
        disabled={isToday}
      >
        <ChevronIcon color={c.text} direction="right" />
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  center: { flex: 1, alignItems: 'center' },
  label: { textAlign: 'center' },
});
