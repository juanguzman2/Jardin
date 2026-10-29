import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import migrations from './migrations/migrations';
import * as schema from './schema';

export const DB_NAME = 'jardin.db';

type Drizzle = ReturnType<typeof drizzle<typeof schema>>;

let instance: { sqlite: SQLiteDatabase; db: Drizzle } | null = null;

/**
 * Abre la base y aplica las migraciones pendientes. Se llama una vez al arrancar
 * (app/_layout.tsx) antes de mostrar cualquier pantalla.
 * En web (solo para pruebas en el navegador) se abre primero en modo asíncrono para
 * esperar a que el worker de SQLite cargue.
 */
export async function openDatabase(): Promise<void> {
  if (instance) return;
  if (Platform.OS === 'web') await openDatabaseAsync(DB_NAME);
  const sqlite = openDatabaseSync(DB_NAME);
  sqlite.execSync('PRAGMA foreign_keys = ON;');
  const db = drizzle(sqlite, { schema });
  await migrate(db, migrations);
  instance = { sqlite, db };
}

function current(): { sqlite: SQLiteDatabase; db: Drizzle } {
  if (!instance) throw new Error('La base de datos aún no está abierta.');
  return instance;
}

/** Conexión única. Toda lectura y escritura pasa por `src/db`. */
export const db = new Proxy({} as Drizzle, {
  get(_target, prop) {
    const target = current().db;
    const value: unknown = Reflect.get(target, prop);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

export function rawDb(): SQLiteDatabase {
  return current().sqlite;
}

export type Db = Drizzle;
