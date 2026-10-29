import { isPossibleCoreThought, ruleStats } from './rules';

describe('isPossibleCoreThought', () => {
  it('3 o más áreas distintas', () => {
    expect(isPossibleCoreThought({ areaIds: ['a', 'b'] })).toBe(false);
    expect(isPossibleCoreThought({ areaIds: ['a', 'b', 'b'] })).toBe(false);
    expect(isPossibleCoreThought({ areaIds: ['a', 'b', 'c'] })).toBe(true);
  });
});

describe('ruleStats', () => {
  const rec = (occurredAt: string, followedRule: 'followed' | 'opposite' | null, ruleId = 'r1') => ({
    ruleId,
    occurredAt,
    followedRule,
  });

  it('apariciones, % de acción opuesta y tendencia de 4 semanas', () => {
    const today = '2026-10-29'; // jueves; semana actual desde el lunes 26
    const records = [
      rec('2026-10-28T08:00:00-05:00', 'opposite'),
      rec('2026-10-27T08:00:00-05:00', 'followed'),
      rec('2026-10-20T08:00:00-05:00', 'followed'),
      rec('2026-10-06T08:00:00-05:00', 'opposite'),
      rec('2026-09-01T08:00:00-05:00', 'opposite'), // fuera de las 4 semanas
      rec('2026-10-28T09:00:00-05:00', null),
      rec('2026-10-28T09:00:00-05:00', 'opposite', 'otra'),
    ];
    const s = ruleStats({ id: 'r1' }, records, today);
    expect(s.appearances).toBe(6);
    expect(s.followed).toBe(2);
    expect(s.opposite).toBe(3);
    expect(s.oppositePct).toBe(60);
    expect(s.trend.map((w) => w.weekStart)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
    expect(s.trend.map((w) => w.appearances)).toEqual([1, 0, 1, 3]);
    expect(s.trend[3]).toMatchObject({ followed: 1, opposite: 1 });
  });

  it('usa la fecha de Bogotá para asignar la semana', () => {
    // 2026-10-26 02:00 UTC = domingo 25 a las 21:00 en Bogotá → semana anterior
    const s = ruleStats({ id: 'r1' }, [rec('2026-10-26T02:00:00Z', 'followed')], '2026-10-29');
    expect(s.trend[2]?.appearances).toBe(1);
    expect(s.trend[3]?.appearances).toBe(0);
  });

  it('sin respuestas el porcentaje es null', () => {
    expect(ruleStats({ id: 'r1' }, [], '2026-10-29').oppositePct).toBeNull();
  });
});
