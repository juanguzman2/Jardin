/*
 * Tipos de dominio. Son estructurales a propósito: las filas de la base de datos
 * (src/db/schema.ts) los cumplen sin conversión, pero el dominio no depende de Drizzle.
 */

export type Direction = 'toward' | 'away' | 'neutral';
export type CommitmentStatus = 'pending' | 'done' | 'minimal' | 'no';
export type CheckStatus = 'done' | 'minimal' | 'no';
export type FollowedRule = 'followed' | 'opposite';
export type FrequencyType = 'daily' | 'weekdays' | 'times_per_week';
export type AutoLink = 'opening' | 'closing';

export interface HabitLike {
  id: string;
  areaId: string;
  frequencyType: FrequencyType;
  /** "1,3,5" con lunes = 1. */
  weekdays: string | null;
  timesPerWeek: number | null;
  startDate: string;
  archived: boolean;
}

export interface CheckLike {
  habitId: string;
  date: string;
  status: CheckStatus;
}

export interface TimelineItemLike {
  direction: Direction | null;
}

export interface RecordLike {
  id: string;
  occurredAt: string;
  longTerm: string | null;
  intensityBefore: number | null;
  intensityAfter: number | null;
  areaId: string | null;
  ruleId: string | null;
  followedRule: FollowedRule | null;
}

export interface RuleLike {
  id: string;
  areaIds: readonly string[];
}
