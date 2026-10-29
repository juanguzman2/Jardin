/*
 * Formato del respaldo JSON. Las filas usan los nombres de columna de SQLite
 * (snake_case) para que el archivo siga siendo legible aunque cambie el código.
 */

export const BACKUP_APP_ID = 'jardin';

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schema_version: number;
  exported_at: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export type BackupValidation =
  | { ok: true; backup: BackupFile }
  | { ok: false; reason: 'invalid' | 'newer' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Valida estructura y versión. Un respaldo de una versión más nueva no se importa. */
export function validateBackup(data: unknown, currentSchemaVersion: number, knownTables: readonly string[]): BackupValidation {
  if (!isRecord(data) || data.app !== BACKUP_APP_ID) return { ok: false, reason: 'invalid' };
  const version = data.schema_version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, reason: 'invalid' };
  if (version > currentSchemaVersion) return { ok: false, reason: 'newer' };
  if (typeof data.exported_at !== 'string' || !isRecord(data.tables)) return { ok: false, reason: 'invalid' };
  for (const [name, rows] of Object.entries(data.tables)) {
    if (!knownTables.includes(name)) continue; // tablas desconocidas se ignoran
    if (!Array.isArray(rows) || !rows.every(isRecord)) return { ok: false, reason: 'invalid' };
  }
  if (!Array.isArray(data.tables.areas)) return { ok: false, reason: 'invalid' };
  return { ok: true, backup: data as unknown as BackupFile };
}

/** Claves de ajustes que no viajan en el respaldo (borradores). */
export function isTransientSetting(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith('draft:');
}

export function backupFileName(day: string): string {
  return `jardin-respaldo-${day}.json`;
}
