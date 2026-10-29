import { format } from 'date-fns';
import { es as dfEs } from 'date-fns/locale';

import { es } from '../copy/es';
import { addDays, isoToBogota } from '../domain/dates';

/** Fecha local solo para formatear (los cálculos se hacen con cadenas `YYYY-MM-DD`). */
function toLocalDate(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** "miércoles, 29 de octubre" */
export function formatDayLong(day: string): string {
  return format(toLocalDate(day), "EEEE, d 'de' MMMM", { locale: dfEs });
}

/** "29 de octubre de 2026" */
export function formatDayWithYear(day: string): string {
  return format(toLocalDate(day), "d 'de' MMMM 'de' yyyy", { locale: dfEs });
}

/** "29 oct" */
export function formatDayShort(day: string): string {
  return format(toLocalDate(day), 'd MMM', { locale: dfEs }).replace('.', '');
}

/** "29/10/2026" */
export function formatDayNumeric(day: string): string {
  return format(toLocalDate(day), 'dd/MM/yyyy');
}

/** "Hoy", "Ayer" o la fecha larga. */
export function relativeDayLabel(day: string, today: string): string {
  if (day === today) return es.common.today;
  if (day === addDays(today, -1)) return es.common.yesterday;
  const label = formatDayLong(day);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "29 oct · 14:30" para un ISO cualquiera, en hora de Bogotá. */
export function formatMoment(iso: string): string {
  const { date, time } = isoToBogota(iso);
  return `${formatDayShort(date)} · ${time}`;
}

export const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const WEEKDAY_NAMES = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;

export function weekdayShort(n: number): string {
  return WEEKDAY_SHORT[n - 1] ?? '';
}

export function weekdayName(n: number): string {
  return WEEKDAY_NAMES[n - 1] ?? '';
}
