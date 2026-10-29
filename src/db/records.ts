import { desc, eq } from 'drizzle-orm';

import { isoToBogota } from '../domain/dates';
import { db } from './client';
import { newId } from './ids';
import { notifyDbChange } from './live';
import { type FunctionalRecord, functionalRecords } from './schema';

export type RecordInput = Omit<FunctionalRecord, 'id' | 'createdAt' | 'updatedAt'>;

export function listRecords(): FunctionalRecord[] {
  return db.select().from(functionalRecords).orderBy(desc(functionalRecords.occurredAt)).all();
}

/** Registros cuyo día en Bogotá cae entre `from` y `to` (inclusive). */
export function listRecordsInRange(from: string, to: string): FunctionalRecord[] {
  return listRecords()
    .filter((r) => {
      const day = isoToBogota(r.occurredAt).date;
      return day >= from && day <= to;
    })
    .reverse();
}

export function listRecordsForRule(ruleId: string): FunctionalRecord[] {
  return db
    .select()
    .from(functionalRecords)
    .where(eq(functionalRecords.ruleId, ruleId))
    .orderBy(desc(functionalRecords.occurredAt))
    .all();
}

export function getRecord(id: string): FunctionalRecord | undefined {
  return db.select().from(functionalRecords).where(eq(functionalRecords.id, id)).get();
}

export function createRecord(input: RecordInput): string {
  const id = newId();
  db.insert(functionalRecords).values({ ...input, id }).run();
  notifyDbChange();
  return id;
}

export function updateRecord(id: string, patch: Partial<RecordInput>): void {
  db.update(functionalRecords).set(patch).where(eq(functionalRecords.id, id)).run();
  notifyDbChange();
}

export function deleteRecord(id: string): void {
  db.delete(functionalRecords).where(eq(functionalRecords.id, id)).run();
  notifyDbChange();
}
