import { filterRecords, isRecordPending, pendingRecords } from './records';
import type { RecordLike } from './types';

const base: RecordLike = {
  id: 'x',
  occurredAt: '2026-10-29T07:00:00-05:00',
  longTerm: null,
  intensityBefore: null,
  intensityAfter: null,
  areaId: null,
  ruleId: null,
  followedRule: null,
};

describe('pendientes', () => {
  const now = new Date('2026-10-29T16:00:00Z'); // 11:00 en Bogotá

  it('más de 3 horas sin largo plazo o sin intensidad posterior', () => {
    expect(isRecordPending(base, now)).toBe(true);
    expect(isRecordPending({ ...base, longTerm: 'Me sentí mejor', intensityAfter: 3 }, now)).toBe(false);
    expect(isRecordPending({ ...base, longTerm: '  ', intensityAfter: 3 }, now)).toBe(true);
    expect(isRecordPending({ ...base, longTerm: 'Algo', intensityAfter: null }, now)).toBe(true);
    expect(isRecordPending({ ...base, intensityAfter: 0, longTerm: 'Algo' }, now)).toBe(false);
  });

  it('con 3 horas o menos todavía no', () => {
    const at = '2026-10-29T08:00:00-05:00'; // 13:00 UTC
    expect(isRecordPending({ ...base, occurredAt: at }, new Date('2026-10-29T15:59:00Z'))).toBe(false);
    expect(isRecordPending({ ...base, occurredAt: at }, new Date('2026-10-29T16:00:00Z'))).toBe(false);
    expect(isRecordPending({ ...base, occurredAt: at }, new Date('2026-10-29T16:01:00Z'))).toBe(true);
  });

  it('ordena del más reciente al más antiguo', () => {
    const list = [
      { ...base, id: 'a', occurredAt: '2026-10-27T08:00:00-05:00' },
      { ...base, id: 'b', occurredAt: '2026-10-28T08:00:00-05:00' },
      { ...base, id: 'c', occurredAt: '2026-10-29T10:30:00-05:00' },
    ];
    expect(pendingRecords(list, now).map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('filterRecords', () => {
  const list: RecordLike[] = [
    { ...base, id: '1', areaId: 'ocio', ruleId: 'r1', intensityBefore: 8 },
    { ...base, id: '2', areaId: 'pareja', ruleId: null, intensityBefore: 3 },
    { ...base, id: '3', areaId: 'ocio', ruleId: null, intensityBefore: null },
  ];

  it('por área, regla e intensidad', () => {
    expect(filterRecords(list, { areaId: 'ocio' }).map((r) => r.id)).toEqual(['1', '3']);
    expect(filterRecords(list, { ruleId: 'r1' }).map((r) => r.id)).toEqual(['1']);
    expect(filterRecords(list, { minIntensity: 5 }).map((r) => r.id)).toEqual(['1']);
    expect(filterRecords(list, { minIntensity: 0, maxIntensity: 4 }).map((r) => r.id)).toEqual(['2']);
    expect(filterRecords(list, {}).length).toBe(3);
  });
});
