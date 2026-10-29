import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { moveArea } from '../../db/areas';
import { useDbQuery } from '../../db/live';
import { getSetting, SETTING_KEYS } from '../../db/settings';
import { addValue, deleteValue, listValues, moveValue } from '../../db/values';
import { isoToBogota } from '../../domain/dates';
import { exportBackup, pickBackup, restoreBackup } from '../../export/backup';
import { ensurePermission, getPermissionState, notificationsSupported, type PermissionState } from '../../notifications';
import { Button } from '../../ui/Button';
import { Card, SectionTitle } from '../../ui/Card';
import { confirm, toast } from '../../ui/feedback';
import { Field } from '../../ui/Field';
import { formatDayWithYear } from '../../ui/format';
import { ChevronIcon } from '../../ui/icons';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { useAreas } from '../common/useAreas';

function MoveButtons({ onUp, onDown, label, first, last }: { onUp: () => void; onDown: () => void; label: string; first: boolean; last: boolean }) {
  const { c } = useTheme();
  return (
    <View style={styles.moveButtons}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${es.common.moveUp}: ${label}`} onPress={onUp} disabled={first} hitSlop={6} style={{ opacity: first ? 0.25 : 1 }}>
        <ChevronIcon color={c.text} direction="up" size={22} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${es.common.moveDown}: ${label}`} onPress={onDown} disabled={last} hitSlop={6} style={{ opacity: last ? 0.25 : 1 }}>
        <ChevronIcon color={c.text} direction="down" size={22} />
      </Pressable>
    </View>
  );
}

export function SettingsScreen() {
  const { c } = useTheme();
  const values = useDbQuery(() => listValues());
  const { areas } = useAreas();
  const lastBackup = useDbQuery(() => getSetting(SETTING_KEYS.lastBackupAt));
  const [newValue, setNewValue] = useState('');
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    getPermissionState().then(setPermission).catch(() => setPermission('denied'));
  }, []);

  const doExport = async () => {
    setBusy('export');
    try {
      await exportBackup();
      toast(es.settings.exportDone);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy('import');
    try {
      const result = await pickBackup();
      if (!result) return;
      if (!result.ok) {
        toast(result.reason === 'newer' ? es.settings.importNewer : es.settings.importInvalid);
        return;
      }
      const ok = await confirm({
        title: es.settings.importConfirmTitle,
        message: es.settings.importConfirmBody(formatDayWithYear(isoToBogota(result.backup.exported_at).date)),
        confirmLabel: es.settings.importReplace,
      });
      if (!ok) return;
      restoreBackup(result.backup);
      toast(es.settings.importDone);
    } finally {
      setBusy(null);
    }
  };

  const permissionText =
    permission === 'granted'
      ? es.settings.notificationsGranted
      : permission === 'denied'
        ? es.settings.notificationsDenied
        : es.settings.notificationsUndetermined;

  return (
    <Screen>
      <Card tone="soft">
        <T style={styles.center}>{es.guidePhrase}</T>
      </Card>

      <SectionTitle>{es.settings.values}</SectionTitle>
      <Card>
        <T variant="small">{es.settings.valuesHelp}</T>
        {values.map((v, i) => (
          <View key={v.id} style={[styles.row, { borderColor: c.border }]}>
            <T style={styles.flex}>{v.text}</T>
            <MoveButtons
              label={v.text}
              first={i === 0}
              last={i === values.length - 1}
              onUp={() => moveValue(v.id, -1)}
              onDown={() => moveValue(v.id, 1)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${es.common.delete}: ${v.text}`}
              hitSlop={8}
              onPress={async () => {
                if (await confirm({})) deleteValue(v.id);
              }}
            >
              <T variant="muted">✕</T>
            </Pressable>
          </View>
        ))}
        <Field
          placeholder={es.settings.valuePlaceholder}
          accessibilityLabel={es.settings.addValue}
          value={newValue}
          onChangeText={setNewValue}
          onSubmitEditing={() => {
            addValue(newValue);
            setNewValue('');
          }}
          returnKeyType="done"
        />
        <Button
          kind="secondary"
          small
          label={es.settings.addValue}
          disabled={!newValue.trim()}
          onPress={() => {
            addValue(newValue);
            setNewValue('');
          }}
          style={styles.alignStart}
        />
      </Card>

      <SectionTitle>{es.settings.areas}</SectionTitle>
      <Card>
        {areas.map((a, i) => (
          <View key={a.id} style={[styles.row, { borderColor: c.border }]}>
            <T style={styles.flex}>{a.name}</T>
            <MoveButtons
              label={a.name}
              first={i === 0}
              last={i === areas.length - 1}
              onUp={() => moveArea(a.id, -1)}
              onDown={() => moveArea(a.id, 1)}
            />
          </View>
        ))}
      </Card>

      <SectionTitle>{es.settings.backup}</SectionTitle>
      <Card>
        <T variant="small">{es.settings.backupHelp}</T>
        <T>
          {lastBackup
            ? es.settings.lastBackup(formatDayWithYear(isoToBogota(lastBackup).date))
            : es.settings.neverBackedUp}
        </T>
        <Button label={es.settings.exportBackup} onPress={() => void doExport()} loading={busy === 'export'} disabled={busy !== null} />
        <Button
          kind="secondary"
          label={es.settings.importBackup}
          onPress={() => void doImport()}
          loading={busy === 'import'}
          disabled={busy !== null}
        />
      </Card>

      <SectionTitle>{es.settings.pdf}</SectionTitle>
      <Button kind="secondary" label={es.settings.pdf} onPress={() => router.push('/export-pdf')} />

      {notificationsSupported ? (
        <>
          <SectionTitle>{es.settings.notifications}</SectionTitle>
          <Card>
            <T>{permissionText}</T>
            {permission === 'undetermined' ? (
              <Button
                kind="secondary"
                small
                label={es.settings.notificationsAsk}
                onPress={async () => {
                  await ensurePermission();
                  setPermission(await getPermissionState());
                }}
                style={styles.alignStart}
              />
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionTitle>{es.settings.about}</SectionTitle>
      <Card>
        <T>{es.settings.aboutBody}</T>
        <T variant="small">{es.settings.version(Constants.expoConfig?.version ?? '1.0.0')}</T>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center', fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
  moveButtons: { flexDirection: 'row', gap: spacing.sm },
  alignStart: { alignSelf: 'flex-start' },
});
