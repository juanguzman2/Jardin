import { diffDays, isoToBogota } from './dates';

/** Días sin respaldo a partir de los cuales se muestra el aviso discreto en "Hoy". */
export const BACKUP_REMINDER_DAYS = 14;

/**
 * Días desde el último respaldo (o desde la instalación si nunca hubo uno).
 * Devuelve null si no hay que mostrar el aviso.
 */
export function backupReminder(
  lastBackupAt: string | null,
  installedAt: string | null,
  today: string,
): { days: number; never: boolean } | null {
  const reference = lastBackupAt ?? installedAt;
  if (!reference) return null;
  const days = diffDays(isoToBogota(reference).date, today);
  if (days <= BACKUP_REMINDER_DAYS) return null;
  return { days, never: lastBackupAt === null };
}
