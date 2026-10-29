import {
  addDays,
  bogotaIso,
  currentTime,
  daysBetween,
  diffDays,
  isoToBogota,
  isValidDay,
  mondayOf,
  normalizeTime,
  today,
  weekdayOf,
} from './dates';

describe('fechas en Bogotá', () => {
  it('usa UTC-5 sin importar la zona del dispositivo', () => {
    // 03:30 UTC del 30 de octubre = 22:30 del 29 en Bogotá
    const instant = new Date('2026-10-30T03:30:00Z');
    expect(today(instant)).toBe('2026-10-29');
    expect(currentTime(instant)).toBe('22:30');
  });

  it('convierte ida y vuelta un instante de Bogotá', () => {
    const iso = bogotaIso('2026-01-05', '07:15');
    expect(iso).toBe('2026-01-05T07:15:00-05:00');
    expect(isoToBogota(iso)).toEqual({ date: '2026-01-05', time: '07:15' });
  });

  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('calcula el día de la semana con lunes = 1', () => {
    expect(weekdayOf('2026-10-26')).toBe(1); // lunes
    expect(weekdayOf('2026-11-01')).toBe(7); // domingo
    expect(mondayOf('2026-11-01')).toBe('2026-10-26');
    expect(mondayOf('2026-10-26')).toBe('2026-10-26');
  });

  it('lista días inclusivos', () => {
    expect(daysBetween('2026-10-30', '2026-11-01')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
    expect(daysBetween('2026-11-02', '2026-11-01')).toEqual([]);
  });

  it('valida y normaliza', () => {
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2026-02-28')).toBe(true);
    expect(normalizeTime('7:5')).toBe('07:05');
    expect(normalizeTime('0730')).toBe('07:30');
    expect(normalizeTime('21')).toBe('21:00');
    expect(normalizeTime('25:00')).toBeNull();
    expect(normalizeTime('hola')).toBeNull();
  });
});
