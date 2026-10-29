import { AREA_IDS, es } from '../copy/es';
import { nowIso, today } from '../domain/dates';
import type { FrequencyType } from '../domain/types';
import { db } from './client';
import { newId } from './ids';
import migrations from './migrations/migrations';
import { areas, habits, ruleAreas, verbalRules } from './schema';
import { getSetting, SETTING_KEYS, setSetting } from './settings';

/** Versión del esquema = número de migraciones aplicadas. Va en el respaldo JSON. */
export const SCHEMA_VERSION = migrations.journal.entries.length;

/** Sube este número si en el futuro se agregan semillas nuevas para instalaciones existentes. */
const SEED_VERSION = 1;

/** Áreas fijas. Se insertan en cada arranque si faltan (no pisan el orden del usuario). */
export function seedAreas(): void {
  AREA_IDS.forEach((id, i) => {
    db.insert(areas).values({ id, name: es.areas[id], sortOrder: i }).onConflictDoNothing().run();
  });
}

const GYM_RULE = {
  thought: 'Debo ir al gym',
  typicalAction: 'Me quedo en el celular y no voy',
  reinforcement: 'Alivio, descanso inmediato',
  consequence: 'Pereza acumulada, sensación de insuficiencia',
  functionalRule: 'Cada vez que no tenga ganas de ir al gym, voy a ir',
  oppositeAction: 'Ponerme la ropa del gym apenas suena la alarma',
};

interface SeedHabit {
  name: string;
  areaId: (typeof AREA_IDS)[number];
  frequencyType: FrequencyType;
  timesPerWeek?: number;
  minimalVersion: string;
  ifThen: string;
  autoLink?: 'opening' | 'closing';
  linkGymRule?: boolean;
}

/** Plan de Fase 1 del usuario. Sin recordatorios activos: el usuario los configura. */
const SEED_HABITS: SeedHabit[] = [
  {
    name: 'Acostarme 21:00–21:30',
    areaId: 'salud_bienestar',
    frequencyType: 'daily',
    minimalVersion: 'Acostarme antes de las 22:00',
    ifThen: 'Si son las 21:00, entonces apago la luz',
  },
  {
    name: 'Levantarme a las 5:00',
    areaId: 'salud_bienestar',
    frequencyType: 'daily',
    minimalVersion: 'Levantarme sin volver a la cama',
    ifThen: 'Si apago la alarma, entonces me pongo de pie y voy por agua',
  },
  {
    name: 'Celular fuera desde las 20:00',
    areaId: 'personal',
    frequencyType: 'daily',
    minimalVersion: 'Celular fuera de la cama',
    ifThen: 'Si son las 20:00, entonces conecto el celular en la sala',
  },
  {
    name: 'Rutina de mañana',
    areaId: 'personal',
    frequencyType: 'daily',
    minimalVersion: 'Leer mis valores',
    ifThen: 'Si tomo el agua, entonces abro la apertura del día',
    autoLink: 'opening',
  },
  {
    name: 'Rutina de noche',
    areaId: 'personal',
    frequencyType: 'daily',
    minimalVersion: 'Una línea de gratitud',
    ifThen: 'Si dejo el celular en la sala, entonces hago el cierre',
    autoLink: 'closing',
  },
  {
    name: 'Comidas sin pantallas',
    areaId: 'salud_bienestar',
    frequencyType: 'daily',
    minimalVersion: 'Una comida sin pantalla',
    ifThen: 'Si me siento a comer, entonces dejo el celular en otra mesa',
  },
  {
    name: 'Ir al gym',
    areaId: 'salud_bienestar',
    frequencyType: 'times_per_week',
    timesPerWeek: 4,
    minimalVersion: 'Ir aunque sea 20 minutos',
    ifThen: 'Si suena la alarma, entonces me pongo la ropa del gym',
    linkGymRule: true,
  },
];

/** Semillas de la primera instalación: regla de ejemplo y hábitos de la Fase 1. */
function seedInitialData(): void {
  const start = today();
  db.transaction((tx) => {
    const ruleId = newId();
    tx.insert(verbalRules).values({ id: ruleId, ...GYM_RULE }).run();
    tx.insert(ruleAreas).values({ ruleId, areaId: 'salud_bienestar' }).run();

    SEED_HABITS.forEach((h, i) => {
      tx.insert(habits)
        .values({
          id: newId(),
          name: h.name,
          areaId: h.areaId,
          valueText: null,
          frequencyType: h.frequencyType,
          weekdays: null,
          timesPerWeek: h.timesPerWeek ?? null,
          minimalVersion: h.minimalVersion,
          ifThen: h.ifThen,
          reminderTime: null,
          reminderWeekdays: null,
          ruleId: h.linkGymRule ? ruleId : null,
          autoLink: h.autoLink ?? null,
          startDate: start,
          phase: 1,
          archived: false,
          sortOrder: i,
        })
        .run();
    });
  });
}

/** Se ejecuta en cada arranque, después de las migraciones. Es idempotente. */
export function seedDatabase(): void {
  seedAreas();
  const seeded = Number(getSetting(SETTING_KEYS.seedVersion) ?? 0);
  if (seeded < 1) {
    seedInitialData();
    setSetting(SETTING_KEYS.installedAt, nowIso(), { silent: true });
  }
  if (seeded < SEED_VERSION) setSetting(SETTING_KEYS.seedVersion, String(SEED_VERSION), { silent: true });
  setSetting(SETTING_KEYS.schemaVersion, String(SCHEMA_VERSION), { silent: true });
}
