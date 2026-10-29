import { isTransientSetting, validateBackup } from './backupFormat';

const tables = ['areas', 'habits', 'settings'];
const valid = {
  app: 'jardin',
  schema_version: 1,
  exported_at: '2026-10-29T20:00:00.000Z',
  tables: { areas: [{ id: 'ocio', name: 'Ocio' }], habits: [], settings: [] },
};

describe('validateBackup', () => {
  it('acepta un respaldo válido', () => {
    expect(validateBackup(valid, 1, tables)).toMatchObject({ ok: true });
  });

  it('acepta versiones anteriores y rechaza más nuevas', () => {
    expect(validateBackup({ ...valid, schema_version: 1 }, 3, tables).ok).toBe(true);
    expect(validateBackup({ ...valid, schema_version: 2 }, 1, tables)).toEqual({ ok: false, reason: 'newer' });
  });

  it('rechaza archivos que no son de Jardín o están dañados', () => {
    expect(validateBackup(null, 1, tables)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateBackup({ ...valid, app: 'otra' }, 1, tables)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateBackup({ ...valid, schema_version: '1' }, 1, tables)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateBackup({ ...valid, tables: { areas: 'x' } }, 1, tables)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateBackup({ ...valid, tables: { habits: [] } }, 1, tables)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateBackup({ ...valid, tables: { ...valid.tables, habits: [1] } }, 1, tables)).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('ignora tablas desconocidas', () => {
    expect(validateBackup({ ...valid, tables: { ...valid.tables, futura: 'x' } }, 1, tables).ok).toBe(true);
  });

  it('los borradores no viajan', () => {
    expect(isTransientSetting('draft:record:new')).toBe(true);
    expect(isTransientSetting('last_backup_at')).toBe(false);
  });
});
