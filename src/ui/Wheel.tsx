import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { es } from '../copy/es';
import { T } from './Text';
import { useTheme } from './theme';

export const WHEEL_ITEM_HEIGHT = 52;
const VISIBLE_ROWS = 3;

export interface WheelItem<V> {
  value: V;
  label: string;
}

/**
 * Columna giratoria tipo reloj: se desliza y se detiene en un valor; el del centro es el elegido.
 * También se puede tocar el valor de arriba o de abajo.
 */
export function Wheel<V extends string | number>({
  items,
  value,
  onChange,
  label,
  width,
}: {
  items: readonly WheelItem<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
  width: number;
}) {
  const { c } = useTheme();
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueIndex = Math.max(0, items.findIndex((i) => i.value === value));
  const [active, setActive] = useState(valueIndex);
  const activeRef = useRef(valueIndex);

  const clamp = (i: number) => Math.min(items.length - 1, Math.max(0, i));
  const scrollToIndex = (i: number, animated: boolean) =>
    ref.current?.scrollTo({ y: i * WHEEL_ITEM_HEIGHT, animated });

  // Si el valor cambia desde afuera (p. ej. "Ahora"), mover la rueda.
  useEffect(() => {
    if (valueIndex !== activeRef.current) {
      activeRef.current = valueIndex;
      setActive(valueIndex);
      scrollToIndex(valueIndex, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueIndex]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  const select = (i: number) => {
    const index = clamp(i);
    activeRef.current = index;
    setActive(index);
    const item = items[index];
    if (item && item.value !== value) onChange(item.value);
  };

  const settle = (y: number) => {
    const index = clamp(Math.round(y / WHEEL_ITEM_HEIGHT));
    if (Math.abs(y - index * WHEEL_ITEM_HEIGHT) > 1) scrollToIndex(index, true);
    select(index);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = clamp(Math.round(y / WHEEL_ITEM_HEIGHT));
    if (index !== active) setActive(index);
    // Se considera detenida cuando deja de moverse un momento (funciona igual en Android y web).
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => settle(y), 140);
  };

  return (
    <View style={{ width, height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentOffset={{ x: 0, y: valueIndex * WHEEL_ITEM_HEIGHT }}
        onLayout={() => scrollToIndex(activeRef.current, false)}
        contentContainerStyle={styles.content}
      >
        {items.map((item, i) => {
          const selected = i === active;
          return (
            <Pressable
              key={String(item.value)}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${item.label}`}
              accessibilityState={{ selected }}
              accessibilityHint={selected ? es.time.selected(item.label) : undefined}
              onPress={() => {
                scrollToIndex(i, true);
                select(i);
              }}
              style={styles.item}
            >
              <T
                style={[styles.text, selected ? styles.selectedText : styles.otherText]}
                color={selected ? c.text : c.muted}
              >
                {item.label}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: WHEEL_ITEM_HEIGHT },
  item: { height: WHEEL_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  text: { fontVariant: ['tabular-nums'] },
  selectedText: { fontSize: 32, fontWeight: '700' },
  otherText: { fontSize: 24, opacity: 0.55 },
});
