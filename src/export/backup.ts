import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { es } from '../copy/es';
import { rawDb } from '../db/client';
import { notifyDbChange } from '../db/live';
import { TABLES_IN_ORDER } from '../db/schema';
import { SCHEMA_VERSION, seedAreas } from '../db/seed';
import { SETTING_KEYS, setSetting } from '../db/settings';
import { nowIso, today } from '../domain/dates';
import { syncHabitReminders } from '../notifications';
import {
  BACKUP_APP_ID,
  type BackupFile,
  backupFileName,
  type BackupValidation,
  isTransientSetting,
  validateBackup,
} from './backupFormat';

export const TABLE_NAMES = TABLES_IN_ORDER.map(([name]) => name);

/** Toda la base en un objeto JSON (sin borradores). */
export function buildBackup(): BackupFile {
  const sqlite = rawDb();
  const tables: BackupFile['tables'] = {};
  for (const name of TABLE_NAMES) {
    const rows = sqlite.getAllSync<Record<string, unknown>>(`SELECT * FROM "${name}"`);
    tables[name] = name === 'settings' ? rows.filter((r) => !isTransientSetting(r.key)) : rows;
  }
  return { app: BACKUP_APP_ID, schema_version: SCHEMA_VERSION, exported_at: nowIso(), tables };
}

/** Escribe el respaldo y abre el menú del sistema para compartirlo (Drive, correo…). */
export async function exportBackup(): Promise<void> {
  const json = JSON.stringify(buildBackup(), null, 2);
  const name = backupFileName(today());
  if (Platform.OS === 'web') {
    // Solo para pruebas en el navegador.
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    await file.write(json);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: es.settings.exportBackup,
      UTI: 'public.json',
    });
  }
  setSetting(SETTING_KEYS.lastBackupAt, nowIso());
}

/** Abre el selector de archivos y valida el respaldo elegido. null = cancelado. */
export async function pickBackup(): Promise<BackupValidation | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  try {
    const text = Platform.OS === 'web' ? await (await fetch(asset.uri)).text() : await new File(asset.uri).text();
    return validateBackup(JSON.parse(text), SCHEMA_VERSION, TABLE_NAMES);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

function toSqlValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' || typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * Reemplaza TODOS los datos por los del respaldo, en una sola transacción.
 * Solo se insertan las columnas que existen hoy; las que falten toman su valor por defecto.
 */
export function restoreBackup(backup: BackupFile): void {
  const sqlite = rawDb();
  const now = nowIso();
  sqlite.withTransactionSync(() => {
    for (const name of [...TABLE_NAMES].reverse()) sqlite.runSync(`DELETE FROM "${name}"`);
    for (const name of TABLE_NAMES) {
      const rows = backup.tables[name] ?? [];
      if (rows.length === 0) continue;
      const columns = sqlite.getAllSync<{ name: string }>(`PRAGMA table_info("${name}")`).map((col) => col.name);
      for (const row of rows) {
        if (name === 'settings' && isTransientSetting(row.key)) continue;
        const values: Record<string, unknown> = { created_at: now, updated_at: now, ...row };
        const keys = Object.keys(values).filter((k) => columns.includes(k));
        if (keys.length === 0) continue;
        sqlite.runSync(
          `INSERT INTO "${name}" (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
          keys.map((k) => toSqlValue(values[k])),
        );
      }
    }
  });
  seedAreas();
  setSetting(SETTING_KEYS.schemaVersion, String(SCHEMA_VERSION), { silent: true });
  setSetting(SETTING_KEYS.lastBackupAt, backup.exported_at, { silent: true });
  notifyDbChange();
  syncHabitReminders().catch(() => undefined);
}
