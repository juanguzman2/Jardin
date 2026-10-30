import { addDays } from './dates';
import {
  areaDayStatus,
  countWateredDays,
  daysToNextStage,
  gardenGrowth,
  gardenHydration,
  gardenStage,
  hydrationLevel,
} from './garden';
import type { CheckLike, CheckStatus, HabitLike } from './types';

const habit = (over: Partial<HabitLike> = {}): HabitLike => ({
  id: 'h1',
  areaId: 'salud',
  frequencyType: 'daily',
  weekdays: null,
  timesPerWeek: null,
  startDate: '2026-01-01',
  archived: false,
  ...over,
});

function seq(from: string, pattern: string, habitId = 'h1'): CheckLike[] {
  const map: Record<string, CheckStatus | undefined> = { d: 'done', m: 'minimal', n: 'no', '.': undefined };
  return [...pattern].flatMap((ch, i) => {
    const status = map[ch];
    return status ? [{ habitId, date: addDays(from, i), status }] : [];
  });
}

describe('gardenStage', () => {
  it.each([
    [0, 'seed'],
    [6, 'seed'],
    [7, 'sprout'],
    [20, 'sprout'],
    [21, 'young'],
    [44, 'young'],
    [45, 'plant'],
    [65, 'plant'],
    [66, 'bloom'],
    [300, 'bloom'],
  ])('%i días regados → %s', (days, stage) => {
    expect(gardenStage(days)).toBe(stage);
  });

  it('días para la siguiente etapa', () => {
    expect(daysToNextStage(0)).toBe(7);
    expect(daysToNextStage(44)).toBe(1);
    expect(daysToNextStage(66)).toBeNull();
  });
});

describe('crecimiento', () => {
  it('cuenta días distintos con algún hábito del área regado', () => {
    const habits = [habit(), habit({ id: 'h2' }), habit({ id: 'h3', areaId: 'otra' })];
    const checks = [
      ...seq('2026-02-01', 'dd.m', 'h1'),
      ...seq('2026-02-01', 'd..d', 'h2'), // mismo día que h1 el 1 y el 4
      ...seq('2026-02-01', 'ddddd', 'h3'), // otra área
      ...seq('2026-02-10', 'n', 'h1'),
    ];
    expect(countWateredDays('salud', habits, checks)).toBe(3);
  });

  it('el crecimiento del jardín no retrocede', () => {
    expect(gardenGrowth(10, 30)).toBe(30);
    expect(gardenGrowth(31, 30)).toBe(31);
    expect(gardenGrowth(5, null)).toBe(5);
    // Al borrar un hábito sus checks desaparecen, pero la etapa se conserva.
    const before = gardenGrowth(countWateredDays('salud', [habit()], seq('2026-02-01', 'd'.repeat(50))), 0);
    const after = gardenGrowth(countWateredDays('salud', [], []), before);
    expect(gardenStage(after)).toBe(gardenStage(before));
  });
});

describe('hydrationLevel', () => {
  it.each([
    [1, 'vibrant'],
    [0.8, 'vibrant'],
    [0.79, 'normal'],
    [0.5, 'normal'],
    [0.49, 'wilted'],
    [0.01, 'wilted'],
    [0, 'very_wilted'],
    [null, 'normal'],
  ] as const)('%p → %s', (ratio, level) => {
    expect(hydrationLevel(ratio)).toBe(level);
  });
});

describe('gardenHydration', () => {
  const today = '2026-03-07';
  const from = addDays(today, -6);

  it('100 % los últimos 7 días → vibrante', () => {
    expect(gardenHydration({ id: 'salud' }, [habit()], seq(from, 'ddddddd'), today)).toEqual({
      level: 'vibrant',
      ratio: 1,
    });
  });

  it('hoy sin marcar no cuenta', () => {
    const r = gardenHydration({ id: 'salud' }, [habit()], seq(from, 'dddddd.'), today);
    expect(r.ratio).toBe(1);
  });

  it('0 % → muy mustia pero viva', () => {
    expect(gardenHydration({ id: 'salud' }, [habit()], [], today).level).toBe('very_wilted');
  });

  it('mezcla de hábitos del área', () => {
    const habits = [habit(), habit({ id: 'h2' })];
    const checks = [...seq(from, 'ddddddd', 'h1'), ...seq(from, 'nnnnnnn', 'h2')];
    expect(gardenHydration({ id: 'salud' }, habits, checks, today)).toEqual({ level: 'normal', ratio: 0.5 });
  });

  it('raíz firme: los días perdidos pesan la mitad', () => {
    const recent = seq(from, 'ddd....'); // 3 regados, 3 perdidos, hoy sin marcar
    expect(gardenHydration({ id: 'salud' }, [habit()], recent, today).ratio).toBeCloseTo(0.5);

    const history = seq(addDays(from, -66), 'd'.repeat(66)); // 66 días antes de la ventana
    const withRoots = gardenHydration({ id: 'salud' }, [habit()], [...history, ...recent], today);
    // 3 perdidos × 0.5 = 1.5 → 3 / 4.5
    expect(withRoots.ratio).toBeCloseTo(3 / 4.5);
  });

  it('hábito creado hace menos de 7 días: solo cuenta desde su inicio', () => {
    const h = habit({ startDate: addDays(today, -2) });
    const r = gardenHydration({ id: 'salud' }, [h], seq(addDays(today, -2), 'dd.'), today);
    expect(r).toEqual({ level: 'vibrant', ratio: 1 });
  });

  it('X veces por semana se prorratea', () => {
    const h = habit({ frequencyType: 'times_per_week', timesPerWeek: 4 });
    expect(gardenHydration({ id: 'salud' }, [h], seq(from, 'd.d.d.d'), today).ratio).toBe(1);
    expect(gardenHydration({ id: 'salud' }, [h], seq(from, 'd.d....'), today).ratio).toBe(0.5);
  });

  it('ignora hábitos archivados y de otras áreas', () => {
    const habits = [habit({ archived: true }), habit({ id: 'h2', areaId: 'otra' })];
    expect(gardenHydration({ id: 'salud' }, habits, [], today)).toEqual({ level: 'normal', ratio: null });
  });
});

describe('areaDayStatus', () => {
  it('regado, seco o sin nada programado', () => {
    const habits = [habit({ frequencyType: 'weekdays', weekdays: '1' })]; // solo lunes
    const checks = seq('2026-03-02', 'd'); // lunes regado
    expect(areaDayStatus('salud', habits, checks, '2026-03-02', '2026-03-20')).toBe('watered');
    expect(areaDayStatus('salud', habits, checks, '2026-03-09', '2026-03-20')).toBe('dry');
    expect(areaDayStatus('salud', habits, checks, '2026-03-10', '2026-03-20')).toBe('none');
    expect(areaDayStatus('salud', habits, [], '2026-03-16', '2026-03-16')).toBe('none'); // hoy
  });
});

describe('jardín con hábitos que ya terminaron', () => {
  it('un hábito terminado no marchita el área', () => {
    const today = '2026-03-20';
    const ended = habit({ startDate: '2026-03-01', endDate: '2026-03-10' });
    expect(gardenHydration({ id: 'salud' }, [ended], [], today)).toEqual({ level: 'normal', ratio: null });
  });

  it('solo cuenta los días del periodo dentro de la ventana', () => {
    const today = '2026-03-20';
    const ended = habit({ startDate: '2026-03-01', endDate: '2026-03-15' }); // ventana 14–20 → 14 y 15
    expect(gardenHydration({ id: 'salud' }, [ended], seq('2026-03-14', 'd.'), today).ratio).toBe(0.5);
  });
});
