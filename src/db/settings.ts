import { eq } from 'drizzle-orm';

import { nowIso } from '../domain/dates';
import { db } from './client';
import { notifyDbChange } from './live';
import { settings } from './schema';

export const SETTING_KEYS = {
  schemaVersion: 'schema_version',
  seedVersion: 'seed_version',
  installedAt: 'installed_at',
  lastBackupAt: 'last_backup_at',
  notificationsAsked: 'notifications_asked',
  gardenMax: (areaId: string) => `garden_max:${areaId}`,
  draft: (key: string) => `draft:${key}`,
} as const;

export function getSetting(key: string): string | null {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value ?? null;
}

export function setSetting(key: string, value: string | null, options: { silent?: boolean } = {}): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: nowIso() } })
    .run();
  if (!options.silent) notifyDbChange();
}

export function deleteSetting(key: string, options: { silent?: boolean } = {}): void {
  db.delete(settings).where(eq(settings.key, key)).run();
  if (!options.silent) notifyDbChange();
}

/* Borradores: se guardan solos mientras se escribe y se borran al guardar. */

export function loadDraft<T>(key: string): T | null {
  const raw = getSetting(SETTING_KEYS.draft(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, value: unknown): void {
  // Silencioso: escribir un borrador no debe recalcular la pantalla.
  setSetting(SETTING_KEYS.draft(key), JSON.stringify(value), { silent: true });
}

export function clearDraft(key: string): void {
  deleteSetting(SETTING_KEYS.draft(key), { silent: true });
}
