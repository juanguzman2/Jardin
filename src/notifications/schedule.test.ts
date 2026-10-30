import type { Habit } from '../db/schema';
import { desiredReminders, reminderDays, toExpoWeekday } from './schedule';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Leer',
  areaId: 'ocio',
  valueText: null,
  frequencyType: 'daily',
  weekdays: null,
  timesPerWeek: null,
  minimalVersion: 'Una página',
  ifThen: 'Si son las 21:00, entonces abro el libro',
  reminderTime: '21:00',
  reminderWeekdays: null,
  ruleId: null,
  autoLink: null,
  startDate: '2026-10-01',
  endDate: null,
  phase: null,
  archived: false,
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const TODAY = '2026-10-30';

describe('recordatorios', () => {
  it('convierte lunes = 1 al formato de expo (domingo = 1)', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(toExpoWeekday)).toEqual([2, 3, 4, 5, 6, 7, 1]);
  });

  it('días: explícitos, los del hábito o todos', () => {
    expect(reminderDays(habit({ reminderWeekdays: '2,4' }))).toEqual([2, 4]);
    expect(reminderDays(habit({ frequencyType: 'weekdays', weekdays: '1,3,5' }))).toEqual([1, 3, 5]);
    expect(reminderDays(habit())).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('el texto es el plan si-entonces y hay uno por día', () => {
    const list = desiredReminders(habit({ reminderWeekdays: '1,7' }), TODAY);
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ identifier: 'habit:h1:1', weekday: 2, hour: 21, minute: 0, body: 'Si son las 21:00, entonces abro el libro' });
    expect(list[1]).toMatchObject({ identifier: 'habit:h1:7', weekday: 1 });
  });

  it('un hábito que ya terminó no suena; uno que termina hoy sí', () => {
    expect(desiredReminders(habit({ endDate: '2026-10-29' }), TODAY)).toEqual([]);
    expect(desiredReminders(habit({ endDate: TODAY }), TODAY).length).toBe(7);
  });

  it('sin hora o archivado: nada', () => {
    expect(desiredReminders(habit({ reminderTime: null }), TODAY)).toEqual([]);
    expect(desiredReminders(habit({ archived: true }), TODAY)).toEqual([]);
  });

  it('la firma cambia si cambia la hora o el texto', () => {
    const a = desiredReminders(habit(), TODAY)[0]?.sig;
    expect(desiredReminders(habit({ reminderTime: '21:30' }), TODAY)[0]?.sig).not.toBe(a);
    expect(desiredReminders(habit({ ifThen: 'Otro plan' }), TODAY)[0]?.sig).not.toBe(a);
    expect(desiredReminders(habit(), TODAY)[0]?.sig).toBe(a);
  });
});
