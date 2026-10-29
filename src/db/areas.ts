import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { notifyDbChange } from './live';
import { type Area, areas } from './schema';

export function listAreas(): Area[] {
  return db.select().from(areas).orderBy(asc(areas.sortOrder), asc(areas.name)).all();
}

/** Mueve un área una posición arriba (-1) o abajo (+1). */
export function moveArea(id: string, delta: -1 | 1): void {
  const list = listAreas();
  const index = list.findIndex((a) => a.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return;
  const reordered = [...list];
  const [moved] = reordered.splice(index, 1);
  if (!moved) return;
  reordered.splice(target, 0, moved);
  db.transaction((tx) => {
    reordered.forEach((a, i) => {
      tx.update(areas).set({ sortOrder: i }).where(eq(areas.id, a.id)).run();
    });
  });
  notifyDbChange();
}
