import type { TimelineItemLike } from './types';

export interface DayBalance {
  toward: number;
  away: number;
  neutral: number;
}

/** Conteo de "me acerca" frente a "me aleja" de la línea de tiempo de un día. */
export function dayBalance(items: readonly TimelineItemLike[]): DayBalance {
  const result: DayBalance = { toward: 0, away: 0, neutral: 0 };
  for (const item of items) {
    if (item.direction === 'toward') result.toward += 1;
    else if (item.direction === 'away') result.away += 1;
    else if (item.direction === 'neutral') result.neutral += 1;
  }
  return result;
}

/** Máximo de acciones comprometidas por día ("Ve a lo simple"). */
export const MAX_COMMITMENTS = 3;
