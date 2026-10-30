import { StyleSheet, View } from 'react-native';

import { es } from '../copy/es';
import { addMinutes, currentTime, from12h, type Period, to12h } from '../domain/dates';
import { ChoiceChips } from './Choice';
import { T } from './Text';
import { radius, spacing, useTheme } from './theme';
import { Wheel, WHEEL_ITEM_HEIGHT, type WheelItem } from './Wheel';

const HOURS: WheelItem<number>[] = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const MINUTES: WheelItem<number>[] = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));
const PERIODS: WheelItem<Period>[] = [
  { value: 'am', label: es.time.am },
  { value: 'pm', label: es.time.pm },
];

/**
 * Selector de hora en formato de 12 horas (hora, minutos y a. m./p. m.), sin escribir.
 * Recibe y devuelve `HH:mm` en 24 h, que es como se guarda.
 */
export function TimeWheel({
  value,
  onChange,
  shortcuts = false,
}: {
  value: string;
  onChange: (time: string) => void;
  /** Muestra atajos: Ahora, Hace 15 min, Hace 30 min, Hace 1 h. */
  shortcuts?: boolean;
}) {
  const { c } = useTheme();
  const { hour, minute, period } = to12h(value);
  const set = (patch: Partial<{ hour: number; minute: number; period: Period }>) => {
    const next = { hour, minute, period, ...patch };
    onChange(from12h(next.hour, next.minute, next.period));
  };

  const shortcutOptions = [0, 15, 30, 60].map((m) => ({ value: m, label: m === 0 ? es.time.now : es.time.ago(m) }));

  return (
    <View style={styles.wrap}>
      <View style={styles.headers}>
        <T variant="small" style={styles.headerHour}>
          {es.time.hour}
        </T>
        <T variant="small" style={styles.headerMinute}>
          {es.time.minutes}
        </T>
        <T variant="small" style={styles.headerPeriod}>
          {es.time.period}
        </T>
      </View>
      <View style={styles.wheels}>
        <View pointerEvents="none" style={[styles.band, { backgroundColor: c.cardAlt }]} />
        <Wheel items={HOURS} value={hour} onChange={(h) => set({ hour: h })} label={es.time.hour} width={72} />
        <T style={styles.colon}>:</T>
        <Wheel items={MINUTES} value={minute} onChange={(m) => set({ minute: m })} label={es.time.minutes} width={72} />
        <Wheel items={PERIODS} value={period} onChange={(p) => set({ period: p })} label={es.time.period} width={96} />
      </View>
      {shortcuts ? (
        <ChoiceChips
          options={shortcutOptions}
          value={null}
          onChange={(m) => onChange(addMinutes(currentTime(), -(m ?? 0)))}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  headers: { flexDirection: 'row', justifyContent: 'center' },
  headerHour: { width: 72, textAlign: 'center' },
  headerMinute: { width: 72 + 20, textAlign: 'center', paddingLeft: 20 },
  headerPeriod: { width: 96, textAlign: 'center' },
  wheels: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: radius.md,
  },
  colon: { width: 20, textAlign: 'center', fontSize: 30, fontWeight: '700' },
});
