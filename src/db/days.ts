import { asc, eq } from 'drizzle-orm';

import { MAX_COMMITMENTS } from '../domain/balance';
import { nowIso } from '../domain/dates';
import type { CommitmentStatus } from '../domain/types';
import { db } from './client';
import { autoMarkLinked } from './habits';
import { newId } from './ids';
import { notifyDbChange } from './live';
import { type DayCommitment, type DayEntry, dayCommitments, dayEntries } from './schema';

export type DayPatch = Partial<Omit<DayEntry, 'date' | 'createdAt' | 'updatedAt'>>;

/** Crea la fila del día si no existe (las tablas del día dependen de ella). */
export function ensureDay(date: string): void {
  db.insert(dayEntries).values({ date }).onConflictDoNothing().run();
}

export function getDay(date: string): DayEntry | undefined {
  return db.select().from(dayEntries).where(eq(dayEntries.date, date)).get();
}

export function updateDay(date: string, patch: DayPatch, options: { silent?: boolean } = {}): void {
  ensureDay(date);
  db.update(dayEntries).set(patch).where(eq(dayEntries.date, date)).run();
  if (!options.silent) notifyDbChange();
}

export function listCommitments(date: string): DayCommitment[] {
  return db
    .select()
    .from(dayCommitments)
    .where(eq(dayCommitments.date, date))
    .orderBy(asc(dayCommitments.sortOrder), asc(dayCommitments.createdAt))
    .all();
}

/** Agrega una acción comprometida. Devuelve false si ya hay 3 ("Ve a lo simple"). */
export function addCommitment(date: string, text: string, areaId: string | null): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const current = listCommitments(date);
  if (current.length >= MAX_COMMITMENTS) return false;
  ensureDay(date);
  db.insert(dayCommitments)
    .values({ id: newId(), date, text: trimmed, areaId, sortOrder: current.length })
    .run();
  notifyDbChange();
  return true;
}

export function setCommitmentStatus(id: string, status: CommitmentStatus): void {
  db.update(dayCommitments).set({ status }).where(eq(dayCommitments.id, id)).run();
  notifyDbChange();
}

export function deleteCommitment(id: string): void {
  db.delete(dayCommitments).where(eq(dayCommitments.id, id)).run();
  notifyDbChange();
}

export function completeOpening(date: string): void {
  updateDay(date, { openingDoneAt: nowIso() }, { silent: true });
  autoMarkLinked('opening', date);
  notifyDbChange();
}

export function completeClosing(date: string): void {
  updateDay(date, { closingDoneAt: nowIso() }, { silent: true });
  autoMarkLinked('closing', date);
  notifyDbChange();
}

export function listDays(from: string, to: string): DayEntry[] {
  return db
    .select()
    .from(dayEntries)
    .all()
    .filter((d) => d.date >= from && d.date <= to);
}

export function commitmentsInRange(from: string, to: string): DayCommitment[] {
  return db
    .select()
    .from(dayCommitments)
    .all()
    .filter((c) => c.date >= from && c.date <= to);
}

