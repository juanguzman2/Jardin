/*
 * Fechas y horas en la zona fija America/Bogota (UTC-5, sin horario de verano desde 1993).
 * Se usa aritmética con desplazamiento fijo para no depender de la zona del dispositivo
 * ni del soporte de Intl en Hermes.
 *
 * Convenciones:
 * - Día: `YYYY-MM-DD`
 * - Hora: `HH:mm`
 * - Timestamps de auditoría: ISO 8601 en UTC (`toISOString()`).
 * - Momentos vividos (p. ej. `occurred_at`): ISO 8601 con desplazamiento `-05:00`.
 */

export const BOGOTA_OFFSET = '-05:00';
const OFFSET_MS = -5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Timestamp de auditoría (UTC). */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

/** Parte un instante en día y hora de Bogotá. */
export function toBogota(instant: Date): { date: string; time: string } {
  const shifted = new Date(instant.getTime() + OFFSET_MS);
  const date = `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
  const time = `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
  return { date, time };
}

export function today(now: Date = new Date()): string {
  return toBogota(now).date;
}

export function currentTime(now: Date = new Date()): string {
  return toBogota(now).time;
}

/** Instante ISO con desplazamiento de Bogotá a partir de día y hora locales. */
export function bogotaIso(date: string, time: string): string {
  return `${date}T${time}:00${BOGOTA_OFFSET}`;
}

/** Día y hora de Bogotá de un ISO cualquiera. */
export function isoToBogota(iso: string): { date: string; time: string } {
  return toBogota(new Date(iso));
}

function dayToUtcMs(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function utcMsToDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(day: string, n: number): string {
  return utcMsToDay(dayToUtcMs(day) + n * DAY_MS);
}

/** Días de `from` a `to` (positivo si `to` es posterior). */
export function diffDays(from: string, to: string): number {
  return Math.round((dayToUtcMs(to) - dayToUtcMs(from)) / DAY_MS);
}

/** Día de la semana con lunes = 1 … domingo = 7. */
export function weekdayOf(day: string): number {
  const js = new Date(dayToUtcMs(day)).getUTCDay(); // 0 = domingo
  return js === 0 ? 7 : js;
}

/** Lunes de la semana (lunes a domingo) que contiene `day`. */
export function mondayOf(day: string): string {
  return addDays(day, 1 - weekdayOf(day));
}

/** Lista inclusiva de días entre `from` y `to`. Vacía si `from` > `to`. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const n = diffDays(from, to);
  for (let i = 0; i <= n; i++) out.push(addDays(from, i));
  return out;
}

export function minDay(a: string, b: string): string {
  return a <= b ? a : b;
}

export function maxDay(a: string, b: string): string {
  return a >= b ? a : b;
}

/** Horas transcurridas entre un ISO y `now`. */
export function hoursSince(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / (60 * 60 * 1000);
}

export function isValidDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && utcMsToDay(dayToUtcMs(day)) === day;
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/** Normaliza entradas como "7:5" o "0730" a `HH:mm`. Devuelve null si no es válida. */
export function normalizeTime(input: string): string | null {
  const trimmed = input.trim();
  let h: number;
  let m: number;
  const colon = /^(\d{1,2}):(\d{1,2})$/.exec(trimmed);
  const compact = /^(\d{1,2})(\d{2})$/.exec(trimmed);
  const hourOnly = /^(\d{1,2})$/.exec(trimmed);
  if (colon) {
    h = Number(colon[1]);
    m = Number(colon[2]);
  } else if (compact) {
    h = Number(compact[1]);
    m = Number(compact[2]);
  } else if (hourOnly) {
    h = Number(hourOnly[1]);
    m = 0;
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

/* Formato de 12 horas (solo para mostrar y elegir; se guarda siempre `HH:mm`). */

export type Period = 'am' | 'pm';

/** "19:05" → { hour: 7, minute: 5, period: 'pm' }. Medianoche es 12 a. m.; mediodía, 12 p. m. */
export function to12h(time: string): { hour: number; minute: number; period: Period } {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const period: Period = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: m, period };
}

/** (7, 5, 'pm') → "19:05". */
export function from12h(hour: number, minute: number, period: Period): string {
  const h24 = (hour % 12) + (period === 'pm' ? 12 : 0);
  return `${pad(h24)}:${pad(minute)}`;
}

/** Suma (o resta) minutos a una hora `HH:mm`, dando la vuelta a la medianoche. */
export function addMinutes(time: string, minutes: number): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
