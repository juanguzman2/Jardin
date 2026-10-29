import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { newId } from './ids';
import { notifyDbChange } from './live';
import { type PersonalValue, personalValues } from './schema';

export function listValues(): PersonalValue[] {
  return db.select().from(personalValues).orderBy(asc(personalValues.sortOrder)).all();
}

export function addValue(text: string, areaId: string | null = null): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const last = listValues().at(-1);
  db.insert(personalValues)
    .values({ id: newId(), text: trimmed, areaId, sortOrder: (last?.sortOrder ?? -1) + 1 })
    .run();
  notifyDbChange();
}

export function updateValue(id: string, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  db.update(personalValues).set({ text: trimmed }).where(eq(personalValues.id, id)).run();
  notifyDbChange();
}

export function deleteValue(id: string): void {
  db.delete(personalValues).where(eq(personalValues.id, id)).run();
  notifyDbChange();
}

export function moveValue(id: string, delta: -1 | 1): void {
  const list = listValues();
  const index = list.findIndex((v) => v.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return;
  const reordered = [...list];
  const [moved] = reordered.splice(index, 1);
  if (!moved) return;
  reordered.splice(target, 0, moved);
  db.transaction((tx) => {
    reordered.forEach((v, i) => {
      tx.update(personalValues).set({ sortOrder: i }).where(eq(personalValues.id, v.id)).run();
    });
  });
  notifyDbChange();
}
