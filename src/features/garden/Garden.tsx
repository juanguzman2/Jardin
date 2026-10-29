import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { useDbQuery } from '../../db/live';
import type { Habit, HabitCheck } from '../../db/schema';
import { DropIcon } from '../../ui/icons';
import { T } from '../../ui/Text';
import { radius, spacing, useTheme } from '../../ui/theme';
import { useAreas } from '../common/useAreas';
import { useUi } from '../common/uiStore';
import { Plant } from './Plant';
import { soilColors } from './soil';
import { type AreaGarden, areaGarden } from './useGarden';

const useNative = Platform.OS !== 'web';

/** Una planta por área. Al marcar un check, la planta del área "bebe". */
function GardenTile({ g }: { g: AreaGarden }) {
  const { c, dark } = useTheme();
  const watered = useUi((s) => s.lastWateredArea);
  const scale = useRef(new Animated.Value(1)).current;
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!watered || watered.areaId !== g.area.id || Date.now() - watered.at > 1500) return;
    drop.setValue(0);
    Animated.parallel([
      Animated.timing(drop, { toValue: 1, duration: 650, useNativeDriver: useNative }),
      Animated.sequence([
        Animated.delay(450),
        Animated.spring(scale, { toValue: 1.08, useNativeDriver: useNative, speed: 40, bounciness: 10 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: useNative, speed: 20, bounciness: 6 }),
      ]),
    ]).start();
  }, [watered, g.area.id, drop, scale]);

  const label = g.unplanted ? es.habits.unplanted : es.stages[g.stage];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${g.area.name}: ${label}`}
      onPress={() =>
        g.unplanted
          ? router.push({ pathname: '/habit/[id]', params: { id: 'new', area: g.area.id } })
          : router.push({ pathname: '/area/[id]', params: { id: g.area.id } })
      }
      style={({ pressed }) => [styles.tile, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.plantBox}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Plant
            stage={g.unplanted ? 'unplanted' : g.stage}
            hydration={g.hydration.level}
            firmRoots={g.firmRoots}
            size={84}
            soil={soilColors(dark, c)}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.drop,
            {
              opacity: drop.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-6, 40] }) }],
            },
          ]}
        >
          <DropIcon color="#5AA9E6" size={14} />
        </Animated.View>
      </View>
      <T variant="small" color={c.text} style={styles.name} numberOfLines={2}>
        {g.area.name}
      </T>
      <T variant="small" style={styles.stage} color={g.unplanted ? c.primary : c.muted}>
        {g.unplanted ? `+ ${es.habits.plant}` : label}
      </T>
    </Pressable>
  );
}

export function Garden({ habits, checks, today }: { habits: Habit[]; checks: HabitCheck[]; today: string }) {
  const { areas } = useAreas();
  // getGardenMax lee ajustes: se recalcula con cada cambio en la base.
  const gardens = useDbQuery(() => areas.map((a) => areaGarden(a, habits, checks, today)), [areas, habits, checks, today]);
  return (
    <View style={styles.grid}>
      {gardens.map((g) => (
        <GardenTile key={g.area.id} g={g} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31.5%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  plantBox: { alignItems: 'center', justifyContent: 'center' },
  drop: { position: 'absolute', top: 0 },
  name: { textAlign: 'center', fontWeight: '600', minHeight: 36 },
  stage: { textAlign: 'center' },
});
