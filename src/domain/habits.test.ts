import { addDays } from './dates';
import {
  computeFlexibleStreak,
  habitDayOf,
  habitPhase,
  hasFirmRoots,
  isScheduled,
  parseWeekdays,
  weeklyCompliance,
} from './habits';
import type { CheckLike, CheckStatus, HabitLike } from './types';

const daily = (over: Partial<HabitLike> = {}): HabitLike => ({
  id: 'h1',
  areaId: 'salud_bienestar',
  frequencyType: 'daily',
  weekdays: null,
  timesPerWeek: null,
  startDate: '2026-10-01',
  archived: false,
  ...over,
});

/** Crea checks consecutivos desde `from` con la secuencia dada ('.' = sin marcar). */
function seq(from: string, pattern: string, habitId = 'h1'): CheckLike[] {
  const map: Record<string, CheckStatus | undefined> = { d: 'done', m: 'minimal', n: 'no', '.': undefined };
  const out: CheckLike[] = [];
  [...pattern].forEach((ch, i) => {
    const status = map[ch];
    if (status) out.push({ habitId, date: addDays(from, i), status });
  });
  return out;
}

describe('parseWeekdays', () => {
  it('ignora valores inválidos y ordena', () => {
    expect(parseWeekdays('5, 1,3,9,x,3')).toEqual([1, 3, 5]);
    expect(parseWeekdays(null)).toEqual([]);
  });
});

describe('isScheduled', () => {
  it('diario: todos los días desde el inicio', () => {
    const h = daily();
    expect(isScheduled(h, '2026-09-30')).toBe(false);
    expect(isScheduled(h, '2026-10-01')).toBe(true);
  });

  it('días específicos: solo los días elegidos (lunes = 1)', () => {
    const h = daily({ frequencyType: 'weekdays', weekdays: '1,3,5' });
    expect(isScheduled(h, '2026-10-26')).toBe(true); // lunes
    expect(isScheduled(h, '2026-10-27')).toBe(false); // martes
    expect(isScheduled(h, '2026-10-28')).toBe(true); // miércoles
  });

  it('X veces por semana: cualquier día', () => {
    expect(isScheduled(daily({ frequencyType: 'times_per_week', timesPerWeek: 4 }), '2026-10-27')).toBe(true);
  });
});

describe('computeFlexibleStreak — diarios', () => {
  const today = '2026-10-10';

  it('cuenta los días cumplidos seguidos', () => {
    const r = computeFlexibleStreak(daily(), seq('2026-10-01', 'dddddddddd'), today);
    expect(r).toMatchObject({ current: 10, longest: 10, needsAttention: false, unit: 'days' });
  });

  it('un día perdido no rompe la racha', () => {
    const r = computeFlexibleStreak(daily(), seq('2026-10-01', 'dddd.ddddd'), today);
    expect(r.current).toBe(9);
    expect(r.needsAttention).toBe(false);
  });

  it('un "no" explícito tampoco la rompe si es uno solo', () => {
    expect(computeFlexibleStreak(daily(), seq('2026-10-01', 'ddndd'), '2026-10-05').current).toBe(4);
  });

  it('dos días seguidos sin cumplir sí la rompen', () => {
    const r = computeFlexibleStreak(daily(), seq('2026-10-01', 'dddd.nddd.'), today);
    // dddd · dos perdidos · ddd · hoy sin marcar
    expect(r.current).toBe(3);
    expect(r.longest).toBe(4);
  });

  it('"mínimo" cuenta como cumplido', () => {
    expect(computeFlexibleStreak(daily(), seq('2026-10-01', 'dmmdmdmmdm'), today).current).toBe(10);
  });

  it('hoy sin marcar no rompe ni suma', () => {
    const r = computeFlexibleStreak(daily(), seq('2026-10-01', 'ddddddddd.'), today);
    expect(r.current).toBe(9);
    expect(r.needsAttention).toBe(false);
  });

  it('hoy marcado suma', () => {
    expect(computeFlexibleStreak(daily(), seq('2026-10-01', 'dddddddddd'), today).current).toBe(10);
  });

  it('marca atención cuando los dos últimos días programados quedaron sin cumplir', () => {
    const r = computeFlexibleStreak(daily(), seq('2026-10-01', 'ddddddd...'), today);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(7);
    expect(r.needsAttention).toBe(true);
  });

  it('los días no programados se ignoran', () => {
    // lunes, miércoles, viernes. 2026-10-05 es lunes.
    const h = daily({ frequencyType: 'weekdays', weekdays: '1,3,5', startDate: '2026-10-05' });
    const checks: CheckLike[] = [
      { habitId: 'h1', date: '2026-10-05', status: 'done' },
      { habitId: 'h1', date: '2026-10-07', status: 'done' },
      { habitId: 'h1', date: '2026-10-09', status: 'done' },
      { habitId: 'h1', date: '2026-10-12', status: 'done' },
    ];
    const r = computeFlexibleStreak(h, checks, '2026-10-13'); // martes
    expect(r.current).toBe(4);
    expect(r.needsAttention).toBe(false);
  });

  it('en días específicos, dos programados perdidos seguidos rompen aunque haya días libres en medio', () => {
    const h = daily({ frequencyType: 'weekdays', weekdays: '1,5', startDate: '2026-10-05' });
    const checks: CheckLike[] = [
      { habitId: 'h1', date: '2026-10-05', status: 'done' }, // lun
      // vie 9 y lun 12 sin marcar
      { habitId: 'h1', date: '2026-10-16', status: 'done' }, // vie
    ];
    const r = computeFlexibleStreak(h, checks, '2026-10-17');
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  it('hábito que aún no empieza', () => {
    expect(computeFlexibleStreak(daily({ startDate: '2026-11-01' }), [], today)).toMatchObject({
      current: 0,
      longest: 0,
      needsAttention: false,
    });
  });

  it('hábito creado hoy, sin marcar: sin aviso', () => {
    expect(computeFlexibleStreak(daily({ startDate: today }), [], today).needsAttention).toBe(false);
  });

  it('ignora checks de otros hábitos', () => {
    const r = computeFlexibleStreak(daily(), seq('2026-10-01', 'dddddddddd', 'otro'), today);
    expect(r.current).toBe(0);
  });
});

describe('computeFlexibleStreak — X veces por semana', () => {
  // 2026-10-05 es lunes
  const h = daily({ frequencyType: 'times_per_week', timesPerWeek: 3, startDate: '2026-10-05' });

  it('cuenta semanas que llegan a la meta', () => {
    const checks = [...seq('2026-10-05', 'd.d.d..'), ...seq('2026-10-12', 'ddd....')];
    const r = computeFlexibleStreak(h, checks, '2026-10-19');
    expect(r).toMatchObject({ current: 2, longest: 2, unit: 'weeks' });
  });

  it('una semana por debajo no la rompe; dos seguidas sí', () => {
    const one = [...seq('2026-10-05', 'ddd'), ...seq('2026-10-12', 'd'), ...seq('2026-10-19', 'ddd')];
    expect(computeFlexibleStreak(h, one, '2026-10-26').current).toBe(2);

    const two = [...seq('2026-10-05', 'ddd'), ...seq('2026-10-12', 'd'), ...seq('2026-10-19', 'n'), ...seq('2026-10-26', 'ddd')];
    const r = computeFlexibleStreak(h, two, '2026-11-02');
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  it('la semana en curso solo cuenta cuando llega a la meta (cambio de semana)', () => {
    const checks = [...seq('2026-10-05', 'ddd'), ...seq('2026-10-12', 'dd')];
    // miércoles 14: la semana en curso va 2/3 → no cuenta todavía
    expect(computeFlexibleStreak(h, checks, '2026-10-14').current).toBe(1);
    // al cerrar la semana (lunes 19) cuenta como no cumplida, pero una sola no rompe
    expect(computeFlexibleStreak(h, checks, '2026-10-19').current).toBe(1);
    // con el tercer check en la semana en curso ya cuenta
    expect(computeFlexibleStreak(h, [...checks, ...seq('2026-10-14', 'd')], '2026-10-14').current).toBe(2);
  });

  it('dos semanas seguidas por debajo activan el aviso', () => {
    const checks = [...seq('2026-10-05', 'ddd'), ...seq('2026-10-12', 'd')];
    expect(computeFlexibleStreak(h, checks, '2026-10-26').needsAttention).toBe(true);
  });

  it('la primera semana parcial no cuenta en contra', () => {
    const mid = { ...h, startDate: '2026-10-09' }; // viernes
    const checks = [...seq('2026-10-09', 'd'), ...seq('2026-10-12', 'ddd')];
    const r = computeFlexibleStreak(mid, checks, '2026-10-19');
    expect(r.current).toBe(1);
    expect(r.needsAttention).toBe(false);
  });
});

describe('hasFirmRoots', () => {
  it('66 días en hecho o mínimo', () => {
    const pattern = 'd'.repeat(40) + 'm'.repeat(25);
    expect(hasFirmRoots({ id: 'h1' }, seq('2026-01-01', pattern))).toBe(false);
    expect(hasFirmRoots({ id: 'h1' }, seq('2026-01-01', pattern + 'm'))).toBe(true);
  });

  it('los "no" no cuentan', () => {
    expect(hasFirmRoots({ id: 'h1' }, seq('2026-01-01', 'n'.repeat(80)))).toBe(false);
  });
});

describe('weeklyCompliance', () => {
  it('días programados hasta hoy, sin contar hoy sin marcar', () => {
    const c = weeklyCompliance(daily(), seq('2026-10-05', 'dd.d'), '2026-10-05', '2026-10-09');
    expect(c).toEqual({ fulfilled: 3, expected: 4 });
  });

  it('X por semana: tope en la meta', () => {
    const h = daily({ frequencyType: 'times_per_week', timesPerWeek: 2 });
    expect(weeklyCompliance(h, seq('2026-10-05', 'ddd'), '2026-10-05', '2026-10-11')).toEqual({
      fulfilled: 2,
      expected: 2,
    });
  });

  it('null si el hábito no había empezado', () => {
    expect(weeklyCompliance(daily({ startDate: '2026-11-01' }), [], '2026-10-05', '2026-10-20')).toBeNull();
  });
});

describe('hábitos con fecha de fin (se repiten durante varios días)', () => {
  const h = daily({ startDate: '2026-10-01', endDate: '2026-10-07' }); // 7 días

  it('solo está programado dentro del periodo', () => {
    expect(isScheduled(h, '2026-09-30')).toBe(false);
    expect(isScheduled(h, '2026-10-01')).toBe(true);
    expect(isScheduled(h, '2026-10-07')).toBe(true);
    expect(isScheduled(h, '2026-10-08')).toBe(false);
  });

  it('después del final no se pierde la racha ni pide atención', () => {
    const r = computeFlexibleStreak(h, seq('2026-10-01', 'ddddddd'), '2026-10-20');
    expect(r).toMatchObject({ current: 7, longest: 7, needsAttention: false });
  });

  it('fase y "día n de total"', () => {
    expect(habitPhase(h, '2026-09-30')).toBe('upcoming');
    expect(habitPhase(h, '2026-10-03')).toBe('active');
    expect(habitPhase(h, '2026-10-08')).toBe('finished');
    expect(habitDayOf(h, '2026-10-03')).toEqual({ day: 3, total: 7 });
    expect(habitDayOf(h, '2026-10-08')).toBeNull();
    expect(habitDayOf(daily(), '2026-10-03')).toBeNull();
  });

  it('el cumplimiento semanal solo cuenta hasta el último día', () => {
    // semana del lunes 5 al domingo 11; el hábito termina el miércoles 7
    expect(weeklyCompliance(h, seq('2026-10-05', 'ddd'), '2026-10-05', '2026-10-20')).toEqual({ fulfilled: 3, expected: 3 });
  });

  it('X veces por semana: la semana final parcial no cuenta en contra', () => {
    const w = daily({ frequencyType: 'times_per_week', timesPerWeek: 3, startDate: '2026-10-05', endDate: '2026-10-14' });
    const checks = [...seq('2026-10-05', 'ddd'), ...seq('2026-10-12', 'd')];
    const r = computeFlexibleStreak(w, checks, '2026-10-30');
    expect(r).toMatchObject({ current: 1, needsAttention: false });
  });
});
