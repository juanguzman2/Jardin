import { getGardenMax } from '../../db/habits';
import type { Area, Habit, HabitCheck } from '../../db/schema';
import {
  countWateredDays,
  type GardenStage,
  gardenGrowth,
  gardenHydration,
  gardenStage,
  type HydrationResult,
} from '../../domain/garden';
import { hasFirmRoots } from '../../domain/habits';

export interface AreaGarden {
  area: Area;
  /** Terreno sin sembrar: sin hábitos activos y sin crecimiento previo. */
  unplanted: boolean;
  wateredDays: number;
  stage: GardenStage;
  hydration: HydrationResult;
  firmRoots: boolean;
  activeHabits: Habit[];
}

export function areaGarden(area: Area, habits: Habit[], checks: HabitCheck[], today: string): AreaGarden {
  const activeHabits = habits.filter((h) => h.areaId === area.id && !h.archived);
  const wateredDays = gardenGrowth(countWateredDays(area.id, habits, checks), getGardenMax(area.id));
  return {
    area,
    unplanted: activeHabits.length === 0 && wateredDays === 0,
    wateredDays,
    stage: gardenStage(wateredDays),
    hydration: gardenHydration(area, habits, checks, today),
    firmRoots: habits.some((h) => h.areaId === area.id && hasFirmRoots(h, checks)),
    activeHabits,
  };
}
