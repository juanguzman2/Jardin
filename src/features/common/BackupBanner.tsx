import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { useDbQuery } from '../../db/live';
import { getSetting, SETTING_KEYS } from '../../db/settings';
import { backupReminder } from '../../domain/backup';
import { exportBackup } from '../../export/backup';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { toast } from '../../ui/feedback';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';

/** Aviso discreto si el último respaldo tiene más de 14 días (sin notificación). */
export function BackupBanner({ today }: { today: string }) {
  const { c } = useTheme();
  const reminder = useDbQuery(
    () => backupReminder(getSetting(SETTING_KEYS.lastBackupAt), getSetting(SETTING_KEYS.installedAt), today),
    [today],
  );
  if (!reminder) return null;
  return (
    <Card tone="warn" style={styles.card}>
      <T variant="small" color={c.warnText} style={styles.text}>
        {reminder.never ? es.today.backupNever : es.today.backupReminder(reminder.days)}
      </T>
      <View>
        <Button small kind="ghost" label={es.today.backupAction} onPress={() => exportBackup().then(() => toast(es.settings.exportDone)).catch(() => undefined)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  text: { flex: 1 },
});
