import { hoursSince } from './dates';
import type { RecordLike } from './types';

/** Horas tras las cuales un auto-registro incompleto aparece en "Pendientes". */
export const PENDING_AFTER_HOURS = 3;

export function isRecordPending(
  record: Pick<RecordLike, 'occurredAt' | 'longTerm' | 'intensityAfter'>,
  now: Date,
): boolean {
  if (hoursSince(record.occurredAt, now) <= PENDING_AFTER_HOURS) return false;
  const missingLongTerm = !record.longTerm || record.longTerm.trim() === '';
  return missingLongTerm || record.intensityAfter === null;
}

/** Registros con más de 3 horas sin consecuencia a largo plazo o sin intensidad posterior. */
export function pendingRecords<T extends Pick<RecordLike, 'occurredAt' | 'longTerm' | 'intensityAfter'>>(
  records: readonly T[],
  now: Date,
): T[] {
  return records
    .filter((r) => isRecordPending(r, now))
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

export interface RecordFilter {
  areaId?: string | null;
  ruleId?: string | null;
  /** Rango de intensidad del malestar al registrar (0–10), inclusivo. */
  minIntensity?: number | null;
  maxIntensity?: number | null;
}

export function filterRecords<T extends Pick<RecordLike, 'areaId' | 'ruleId' | 'intensityBefore'>>(
  records: readonly T[],
  filter: RecordFilter,
): T[] {
  const hasRange = filter.minIntensity != null || filter.maxIntensity != null;
  const min = filter.minIntensity ?? 0;
  const max = filter.maxIntensity ?? 10;
  return records.filter((r) => {
    if (filter.areaId && r.areaId !== filter.areaId) return false;
    if (filter.ruleId && r.ruleId !== filter.ruleId) return false;
    if (hasRange) {
      if (r.intensityBefore === null) return false;
      if (r.intensityBefore < min || r.intensityBefore > max) return false;
    }
    return true;
  });
}
