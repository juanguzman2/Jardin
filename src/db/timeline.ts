import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from './client';
import { ensureDay } from './days';
import { newId } from './ids';
import { notifyDbChange } from './live';
import { type TimelineItem, timelineItems } from './schema';

export type TimelineInput = Omit<TimelineItem, 'id' | 'createdAt' | 'updatedAt'>;

export function listTimeline(date: string): TimelineItem[] {
  return db
    .select()
    .from(timelineItems)
    .where(eq(timelineItems.date, date))
    .orderBy(asc(timelineItems.time), asc(timelineItems.createdAt))
    .all();
}

export function listTimelineRange(from: string, to: string): TimelineItem[] {
  return db
    .select()
    .from(timelineItems)
    .where(and(gte(timelineItems.date, from), lte(timelineItems.date, to)))
    .orderBy(asc(timelineItems.date), asc(timelineItems.time))
    .all();
}

export function getTimelineItem(id: string): TimelineItem | undefined {
  return db.select().from(timelineItems).where(eq(timelineItems.id, id)).get();
}

export function createTimelineItem(input: TimelineInput): string {
  ensureDay(input.date);
  const id = newId();
  db.insert(timelineItems).values({ ...input, id }).run();
  notifyDbChange();
  return id;
}

export function updateTimelineItem(id: string, patch: Partial<TimelineInput>): void {
  if (patch.date) ensureDay(patch.date);
  db.update(timelineItems).set(patch).where(eq(timelineItems.id, id)).run();
  notifyDbChange();
}

export function deleteTimelineItem(id: string): void {
  db.delete(timelineItems).where(eq(timelineItems.id, id)).run();
  notifyDbChange();
}
