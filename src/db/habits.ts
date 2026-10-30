import { and, asc, eq, inArray } from 'drizzle-orm';

import { countWateredDays, gardenGrowth } from '../domain/garden';
import { isFulfilled, isScheduled } from '../domain/habits';
import type { AutoLink, CheckStatus } from '../domain/types';
import { db } from './client';
import { newId } from './ids';
import { notifyDbChange } from './live';
import { type Habit, type HabitCheck, type ObstacleNote, habitChecks, habits, obstacleNotes } from './schema';
import { getSetting, SETTING_KEYS, setSetting } from './settings';

export type HabitInput = Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>;

export function listHabits(options: { includeArchived?: boolean } = {}): Habit[] {
  const rows = db.select().from(habits).orderBy(asc(habits.sortOrder), asc(habits.createdAt)).all();
  return options.includeArchived ? rows : rows.filter((h) => !h.archived);
}

export function getHabit(id: string): Habit | undefined {
  return db.select().from(habits).where(eq(habits.id, id)).get();
}

export function createHabit(input: HabitInput): Habit {
  const last = db.select().from(habits).orderBy(asc(habits.sortOrder)).all().at(-1);
  const row = { ...input, id: newId(), sortOrder: (last?.sortOrder ?? -1) + 1 };
  db.insert(habits).values(row).run();
  notifyDbChange();
  return getHabit(row.id)!;
}

export function updateHabit(id: string, patch: Partial<HabitInput>): void {
  const before = getHabit(id);
  db.update(habits).set(patch).where(eq(habits.id, id)).run();
  // Si cambia de área, la planta anterior conserva lo que ya creció.
  if (before && patch.areaId && patch.areaId !== before.areaId) {
    rememberGardenGrowth(before.areaId);
    rememberGardenGrowth(patch.areaId);
  }
  notifyDbChange();
}

export function deleteHabit(id: string): void {
  const habit = getHabit(id);
  if (habit) rememberGardenGrowth(habit.areaId);
  db.delete(habits).where(eq(habits.id, id)).run();
  notifyDbChange();
}

export function listChecks(): HabitCheck[] {
  return db.select().from(habitChecks).all();
}

export function listChecksForHabits(ids: readonly string[]): HabitCheck[] {
  if (ids.length === 0) return [];
  return db.select().from(habitChecks).where(inArray(habitChecks.habitId, [...ids])).all();
}

export function getCheck(habitId: string, date: string): HabitCheck | undefined {
  return db
    .select()
    .from(habitChecks)
    .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, date)))
    .get();
}

/** Marca (o desmarca con `null`) un hábito en un día. */
export function setCheck(habitId: string, date: string, status: CheckStatus | null, note?: string | null): void {
  if (status === null) {
    db.delete(habitChecks)
      .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, date)))
      .run();
  } else {
    const set: Partial<HabitCheck> = { status };
    if (note !== undefined) set.note = note;
    db.insert(habitChecks)
      .values({ habitId, date, status, note: note ?? null })
      .onConflictDoUpdate({ target: [habitChecks.habitId, habitChecks.date], set })
      .run();
  }
  const habit = getHabit(habitId);
  if (habit && isFulfilled(status)) rememberGardenGrowth(habit.areaId);
  notifyDbChange();
}

export function setCheckNote(habitId: string, date: string, note: string): void {
  db.update(habitChecks)
    .set({ note: note.trim() || null })
    .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, date)))
    .run();
  notifyDbChange();
}

/**
 * Al completar la apertura o el cierre, marca como "hecho" los hábitos vinculados
 * que estén programados ese día y no tengan ya un "hecho" o "mínimo".
 */
export function autoMarkLinked(link: AutoLink, date: string): void {
  const linked = listHabits().filter((h) => h.autoLink === link && isScheduled(h, date));
  for (const h of linked) {
    const existing = getCheck(h.id, date);
    if (!existing || !isFulfilled(existing.status)) setCheck(h.id, date, 'done');
  }
}

/* Jardín: el crecimiento nunca retrocede. */

export function getGardenMax(areaId: string): number {
  const raw = getSetting(SETTING_KEYS.gardenMax(areaId));
  return raw ? Number(raw) || 0 : 0;
}

/** Guarda el máximo de días regados alcanzado por un área. */
export function rememberGardenGrowth(areaId: string): number {
  const all = listHabits({ includeArchived: true });
  const computed = countWateredDays(areaId, all, listChecks());
  const stored = getGardenMax(areaId);
  const growth = gardenGrowth(computed, stored);
  if (growth > stored) setSetting(SETTING_KEYS.gardenMax(areaId), String(growth), { silent: true });
  return growth;
}

/* Notas de obstáculos (tarjeta de "dos días seguidos sin regar"). */

export function addObstacleNote(habitId: string, date: string, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  db.insert(obstacleNotes).values({ id: newId(), habitId, date, text: trimmed }).run();
  notifyDbChange();
}

export function listObstacleNotes(habitId?: string): ObstacleNote[] {
  const q = db.select().from(obstacleNotes);
  return (habitId ? q.where(eq(obstacleNotes.habitId, habitId)) : q).orderBy(asc(obstacleNotes.date)).all();
}
