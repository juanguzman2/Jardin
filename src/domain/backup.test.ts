import { backupReminder } from './backup';

describe('backupReminder', () => {
  it('avisa con más de 14 días', () => {
    expect(backupReminder('2026-10-01T12:00:00Z', null, '2026-10-15')).toBeNull();
    expect(backupReminder('2026-10-01T12:00:00Z', null, '2026-10-16')).toEqual({ days: 15, never: false });
  });

  it('sin respaldos cuenta desde la instalación', () => {
    expect(backupReminder(null, '2026-10-01T12:00:00Z', '2026-10-20')).toEqual({ days: 19, never: true });
    expect(backupReminder(null, '2026-10-10T12:00:00Z', '2026-10-20')).toBeNull();
    expect(backupReminder(null, null, '2026-10-20')).toBeNull();
  });
});
