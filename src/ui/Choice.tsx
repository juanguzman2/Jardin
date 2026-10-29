import { Pressable, StyleSheet, View } from 'react-native';

import { T } from './Text';
import { radius, spacing, useTheme } from './theme';

export interface Option<V extends string | number> {
  value: V;
  label: string;
  color?: string;
}

function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}) {
  const { c } = useTheme();
  const accent = color ?? c.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? accent : c.border,
          backgroundColor: selected ? accent : c.card,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <T style={styles.chipText} color={selected ? c.primaryText : c.text}>
        {label}
      </T>
    </Pressable>
  );
}

/** Selección única. Tocar la opción elegida la quita si `allowNone`. */
export function ChoiceChips<V extends string | number>({
  options,
  value,
  onChange,
  allowNone = true,
}: {
  options: readonly Option<V>[];
  value: V | null;
  onChange: (value: V | null) => void;
  allowNone?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          label={o.label}
          color={o.color}
          selected={value === o.value}
          onPress={() => onChange(value === o.value && allowNone ? null : o.value)}
        />
      ))}
    </View>
  );
}

export function MultiChips<V extends string | number>({
  options,
  values,
  onChange,
}: {
  options: readonly Option<V>[];
  values: readonly V[];
  onChange: (values: V[]) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <Chip
            key={String(o.value)}
            label={o.label}
            color={o.color}
            selected={selected}
            onPress={() => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])}
          />
        );
      })}
    </View>
  );
}

/** Escala numérica (0–10 o 1–10) en una o dos filas de botones grandes. */
export function ScalePicker({
  min,
  max,
  value,
  onChange,
  label,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
}) {
  const { c } = useTheme();
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={styles.scale} accessibilityLabel={label}>
      {numbers.map((n) => {
        const selected = value === n;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${n}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? null : n)}
            style={[
              styles.scaleItem,
              { backgroundColor: selected ? c.primary : c.cardAlt, borderColor: selected ? c.primary : c.border },
            ]}
          >
            <T style={styles.scaleText} color={selected ? c.primaryText : c.text}>
              {n}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontSize: 15 },
  scale: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scaleItem: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleText: { fontWeight: '600' },
});
