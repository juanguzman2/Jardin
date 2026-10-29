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
  phase: null,
  archived: false,
  sortOrder: 0,
  createdAt: '',
  updatedAt: '',
  ...over,
});

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
    const list = desiredReminders(habit({ reminderWeekdays: '1,7' }));
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ identifier: 'habit:h1:1', weekday: 2, hour: 21, minute: 0, body: 'Si son las 21:00, entonces abro el libro' });
    expect(list[1]).toMatchObject({ identifier: 'habit:h1:7', weekday: 1 });
  });

  it('sin hora o archivado: nada', () => {
    expect(desiredReminders(habit({ reminderTime: null }))).toEqual([]);
    expect(desiredReminders(habit({ archived: true }))).toEqual([]);
  });

  it('la firma cambia si cambia la hora o el texto', () => {
    const a = desiredReminders(habit())[0]?.sig;
    expect(desiredReminders(habit({ reminderTime: '21:30' }))[0]?.sig).not.toBe(a);
    expect(desiredReminders(habit({ ifThen: 'Otro plan' }))[0]?.sig).not.toBe(a);
    expect(desiredReminders(habit())[0]?.sig).toBe(a);
  });
});
