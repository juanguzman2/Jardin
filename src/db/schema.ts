import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { nowIso } from '../domain/dates';
import type {
  AutoLink,
  CheckStatus,
  CommitmentStatus,
  Direction,
  FollowedRule,
  FrequencyType,
} from '../domain/types';

/*
 * Esquema de la base de datos (sección 7 de CLAUDE.md).
 * - Días como texto `YYYY-MM-DD` y horas como `HH:mm`, en hora de Bogotá.
 * - Timestamps como ISO 8601.
 * - Cambios de esquema SIEMPRE con migración nueva (`npm run db:generate`).
 */

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => nowIso()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => nowIso())
    .$onUpdateFn(() => nowIso()),
};


export const areas = sqliteTable('areas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

/** Valores personales que se leen en la apertura del día. */
export const personalValues = sqliteTable('values', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  areaId: text('area_id').references(() => areas.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

export const dayEntries = sqliteTable('day_entries', {
  date: text('date').primaryKey(),
  valuesRead: integer('values_read', { mode: 'boolean' }).notNull().default(false),
  satisfaction: integer('satisfaction'),
  gratitude1: text('gratitude_1'),
  gratitude2: text('gratitude_2'),
  gratitude3: text('gratitude_3'),
  step: text('step'),
  learning: text('learning'),
  openingDoneAt: text('opening_done_at'),
  closingDoneAt: text('closing_done_at'),
  ...timestamps,
});

export const dayCommitments = sqliteTable('day_commitments', {
  id: text('id').primaryKey(),
  date: text('date')
    .notNull()
    .references(() => dayEntries.date, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  areaId: text('area_id').references(() => areas.id, { onDelete: 'set null' }),
  status: text('status').$type<CommitmentStatus>().notNull().default('pending'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
}, (t) => [index('day_commitments_date_idx').on(t.date)]);

export const timelineItems = sqliteTable('timeline_items', {
  id: text('id').primaryKey(),
  date: text('date')
    .notNull()
    .references(() => dayEntries.date, { onDelete: 'cascade' }),
  time: text('time').notNull(),
  activity: text('activity').notNull(),
  thought: text('thought'),
  direction: text('direction').$type<Direction>(),
  areaId: text('area_id').references(() => areas.id, { onDelete: 'set null' }),
  ...timestamps,
}, (t) => [index('timeline_items_date_idx').on(t.date)]);

export const verbalRules = sqliteTable('verbal_rules', {
  id: text('id').primaryKey(),
  thought: text('thought').notNull(),
  typicalAction: text('typical_action'),
  reinforcement: text('reinforcement'),
  consequence: text('consequence'),
  functionalRule: text('functional_rule'),
  oppositeAction: text('opposite_action'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

export const ruleAreas = sqliteTable(
  'rule_areas',
  {
    ruleId: text('rule_id')
      .notNull()
      .references(() => verbalRules.id, { onDelete: 'cascade' }),
    areaId: text('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.ruleId, t.areaId] })],
);

export const functionalRecords = sqliteTable('functional_records', {
  id: text('id').primaryKey(),
  occurredAt: text('occurred_at').notNull(),
  context: text('context').notNull(),
  body: text('body'),
  thought: text('thought'),
  action: text('action'),
  longTerm: text('long_term'),
  intensityBefore: integer('intensity_before'),
  intensityAfter: integer('intensity_after'),
  areaId: text('area_id').references(() => areas.id, { onDelete: 'set null' }),
  direction: text('direction').$type<Direction>(),
  ruleId: text('rule_id').references(() => verbalRules.id, { onDelete: 'set null' }),
  followedRule: text('followed_rule').$type<FollowedRule>(),
  ...timestamps,
}, (t) => [
  index('functional_records_occurred_at_idx').on(t.occurredAt),
  index('functional_records_rule_idx').on(t.ruleId),
]);

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  areaId: text('area_id')
    .notNull()
    .references(() => areas.id),
  valueText: text('value_text'),
  frequencyType: text('frequency_type').$type<FrequencyType>().notNull().default('daily'),
  /** Días de la semana separados por coma, lunes = 1 … domingo = 7. Ej. "1,3,5". */
  weekdays: text('weekdays'),
  timesPerWeek: integer('times_per_week'),
  minimalVersion: text('minimal_version'),
  ifThen: text('if_then'),
  reminderTime: text('reminder_time'),
  /** Igual que `weekdays`. Vacío = todos los días programados del hábito. */
  reminderWeekdays: text('reminder_weekdays'),
  ruleId: text('rule_id').references(() => verbalRules.id, { onDelete: 'set null' }),
  autoLink: text('auto_link').$type<AutoLink>(),
  startDate: text('start_date').notNull(),
  /** Último día en que se repite (inclusive). Null = sin fecha de fin. */
  endDate: text('end_date'),
  phase: integer('phase'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

export const habitChecks = sqliteTable(
  'habit_checks',
  {
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    status: text('status').$type<CheckStatus>().notNull(),
    note: text('note'),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.habitId, t.date] }), index('habit_checks_date_idx').on(t.date)],
);

export const obstacleNotes = sqliteTable('obstacle_notes', {
  id: text('id').primaryKey(),
  habitId: text('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  text: text('text').notNull(),
  ...timestamps,
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
  ...timestamps,
});

export type { AutoLink, CheckStatus, CommitmentStatus, Direction, FollowedRule, FrequencyType };

export type Area = typeof areas.$inferSelect;
export type PersonalValue = typeof personalValues.$inferSelect;
export type DayEntry = typeof dayEntries.$inferSelect;
export type DayCommitment = typeof dayCommitments.$inferSelect;
export type TimelineItem = typeof timelineItems.$inferSelect;
export type VerbalRule = typeof verbalRules.$inferSelect;
export type RuleArea = typeof ruleAreas.$inferSelect;
export type FunctionalRecord = typeof functionalRecords.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitCheck = typeof habitChecks.$inferSelect;
export type ObstacleNote = typeof obstacleNotes.$inferSelect;
export type Setting = typeof settings.$inferSelect;

/** Orden de las tablas respetando llaves foráneas (para respaldo e importación). */
export const TABLES_IN_ORDER = [
  ['areas', areas],
  ['values', personalValues],
  ['day_entries', dayEntries],
  ['day_commitments', dayCommitments],
  ['timeline_items', timelineItems],
  ['verbal_rules', verbalRules],
  ['rule_areas', ruleAreas],
  ['functional_records', functionalRecords],
  ['habits', habits],
  ['habit_checks', habitChecks],
  ['obstacle_notes', obstacleNotes],
  ['settings', settings],
] as const;
