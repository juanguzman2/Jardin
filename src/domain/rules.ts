import { addDays, isoToBogota, mondayOf } from './dates';
import type { RecordLike, RuleLike } from './types';

/** Una regla que aparece en 3 o más áreas puede ser el pensamiento principal. */
export const CORE_THOUGHT_MIN_AREAS = 3;

export function isPossibleCoreThought(rule: Pick<RuleLike, 'areaIds'>): boolean {
  return new Set(rule.areaIds).size >= CORE_THOUGHT_MIN_AREAS;
}

export interface RuleWeek {
  /** Lunes de la semana. */
  weekStart: string;
  appearances: number;
  followed: number;
  opposite: number;
}

export interface RuleStats {
  appearances: number;
  followed: number;
  opposite: number;
  /** % de acción opuesta sobre los registros con respuesta; null si no hay ninguno. */
  oppositePct: number | null;
  /** Últimas 4 semanas (lunes a domingo), de la más antigua a la actual. */
  trend: RuleWeek[];
}

export function ruleStats(
  rule: Pick<RuleLike, 'id'>,
  records: readonly Pick<RecordLike, 'ruleId' | 'occurredAt' | 'followedRule'>[],
  today: string,
): RuleStats {
  const linked = records.filter((r) => r.ruleId === rule.id);
  const followed = linked.filter((r) => r.followedRule === 'followed').length;
  const opposite = linked.filter((r) => r.followedRule === 'opposite').length;
  const answered = followed + opposite;

  const currentMonday = mondayOf(today);
  const trend: RuleWeek[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = addDays(currentMonday, -7 * i);
    const weekEnd = addDays(weekStart, 6);
    const inWeek = linked.filter((r) => {
      const day = isoToBogota(r.occurredAt).date;
      return day >= weekStart && day <= weekEnd;
    });
    trend.push({
      weekStart,
      appearances: inWeek.length,
      followed: inWeek.filter((r) => r.followedRule === 'followed').length,
      opposite: inWeek.filter((r) => r.followedRule === 'opposite').length,
    });
  }

  return {
    appearances: linked.length,
    followed,
    opposite,
    oppositePct: answered > 0 ? Math.round((opposite / answered) * 100) : null,
    trend,
  };
}
