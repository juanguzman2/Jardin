import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { es } from '../../copy/es';
import { createHabit, deleteHabit, getHabit, updateHabit } from '../../db/habits';
import { useDbQuery } from '../../db/live';
import { listRules } from '../../db/rules';
import { isValidDay, normalizeTime, today } from '../../domain/dates';
import { formatWeekdays, parseWeekdays } from '../../domain/habits';
import type { AutoLink, FrequencyType } from '../../domain/types';
import { ensurePermission, notificationsSupported, syncHabitReminders } from '../../notifications';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips, MultiChips, ScalePicker } from '../../ui/Choice';
import { DateStepper } from '../../ui/DateStepper';
import { confirm } from '../../ui/feedback';
import { Field } from '../../ui/Field';
import { WEEKDAY_NAMES } from '../../ui/format';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { TimeWheel } from '../../ui/TimeWheel';
import { spacing, useTheme } from '../../ui/theme';
import { useAreas } from '../common/useAreas';

const WEEKDAY_OPTIONS = WEEKDAY_NAMES.map((label, i) => ({ value: i + 1, label }));

function resync() {
  syncHabitReminders().catch(() => undefined);
}

export function HabitForm({ id, areaId: initialArea }: { id: string; areaId?: string }) {
  const { c } = useTheme();
  const isNew = id === 'new';
  const [existing] = useState(() => (isNew ? undefined : getHabit(id)));
  const { options: areaOptions } = useAreas();
  const rules = useDbQuery(() => listRules());

  const [name, setName] = useState(existing?.name ?? '');
  const [areaId, setAreaId] = useState<string | null>(existing?.areaId ?? initialArea ?? null);
  const [valueText, setValueText] = useState(existing?.valueText ?? '');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(existing?.frequencyType ?? 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(parseWeekdays(existing?.weekdays));
  const [timesPerWeek, setTimesPerWeek] = useState<number | null>(existing?.timesPerWeek ?? 3);
  const [minimalVersion, setMinimalVersion] = useState(existing?.minimalVersion ?? '');
  const [ifThen, setIfThen] = useState(existing?.ifThen ?? '');
  const [reminderOn, setReminderOn] = useState(!!existing?.reminderTime);
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '20:00');
  const [reminderDays, setReminderDays] = useState<number[]>(parseWeekdays(existing?.reminderWeekdays));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [ruleId, setRuleId] = useState<string | null>(existing?.ruleId ?? null);
  const [autoLink, setAutoLink] = useState<AutoLink | 'none'>(existing?.autoLink ?? 'none');
  const [startDate, setStartDate] = useState(existing?.startDate ?? today());
  const [phase, setPhase] = useState(existing?.phase != null ? String(existing.phase) : '');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'area' | 'days' | 'reminder' | 'start', string>>>({});

  const toggleReminder = async (on: boolean) => {
    setReminderOn(on);
    if (on) setPermissionDenied(!(await ensurePermission()));
  };

  const save = () => {
    const time = reminderOn ? normalizeTime(reminderTime) : null;
    const next = {
      name: name.trim() ? undefined : es.common.required,
      area: areaId ? undefined : es.common.required,
      days: frequencyType === 'weekdays' && weekdays.length === 0 ? es.habitForm.pickDays : undefined,
      reminder: reminderOn && !time ? es.timelineForm.invalidTime : undefined,
      start: isValidDay(startDate) ? undefined : es.recordForm.invalidDate,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !areaId) return;

    const phaseNumber = Number(phase);
    const data = {
      name: name.trim(),
      areaId,
      valueText: valueText.trim() || null,
      frequencyType,
      weekdays: frequencyType === 'weekdays' ? formatWeekdays(weekdays) : null,
      timesPerWeek: frequencyType === 'times_per_week' ? (timesPerWeek ?? 1) : null,
      minimalVersion: minimalVersion.trim() || null,
      ifThen: ifThen.trim() || null,
      reminderTime: time,
      reminderWeekdays: time && reminderDays.length > 0 ? formatWeekdays(reminderDays) : null,
      ruleId,
      autoLink: autoLink === 'none' ? null : autoLink,
      startDate,
      phase: phase.trim() && Number.isInteger(phaseNumber) ? phaseNumber : null,
      archived: existing?.archived ?? false,
    };
    if (existing) updateHabit(existing.id, data);
    else createHabit(data);
    resync();
    router.back();
  };

  const toggleArchived = () => {
    if (!existing) return;
    updateHabit(existing.id, { archived: !existing.archived });
    resync();
    router.back();
  };

  const remove = async () => {
    if (!existing || !(await confirm({ message: es.habitForm.deleteBody }))) return;
    deleteHabit(existing.id);
    resync();
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? es.habitForm.newTitle : es.habitForm.editTitle }} />
      <Screen footer={<Button label={es.common.save} onPress={save} />}>
        <Field
          label={es.habitForm.name}
          placeholder={es.habitForm.namePlaceholder}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoFocus={isNew}
        />
        <View style={styles.block}>
          <T style={styles.label}>{es.habitForm.area}</T>
          <ChoiceChips options={areaOptions} value={areaId} onChange={setAreaId} allowNone={false} />
          {errors.area ? (
            <T variant="small" color={c.away}>
              {errors.area}
            </T>
          ) : null}
        </View>
        <Field
          label={es.habitForm.value}
          placeholder={es.habitForm.valuePlaceholder}
          value={valueText}
          onChangeText={setValueText}
        />

        <View style={styles.block}>
          <T style={styles.label}>{es.habitForm.frequency}</T>
          <ChoiceChips
            options={[
              { value: 'daily' as const, label: es.habitForm.daily },
              { value: 'weekdays' as const, label: es.habitForm.weekdays },
              { value: 'times_per_week' as const, label: es.habitForm.timesPerWeek },
            ]}
            value={frequencyType}
            onChange={(v) => v && setFrequencyType(v)}
            allowNone={false}
          />
          {frequencyType === 'weekdays' ? (
            <>
              <MultiChips options={WEEKDAY_OPTIONS} values={weekdays} onChange={setWeekdays} />
              {errors.days ? (
                <T variant="small" color={c.away}>
                  {errors.days}
                </T>
              ) : null}
            </>
          ) : null}
          {frequencyType === 'times_per_week' ? (
            <>
              <ScalePicker
                min={1}
                max={7}
                value={timesPerWeek}
                onChange={setTimesPerWeek}
                label={es.habitForm.timesPerWeek}
              />
              <T variant="small">{es.habitForm.timesPerWeekLabel(timesPerWeek ?? 1)}</T>
            </>
          ) : null}
        </View>

        <Field
          label={es.habitForm.minimal}
          placeholder={es.habitForm.minimalPlaceholder}
          value={minimalVersion}
          onChangeText={setMinimalVersion}
        />
        <Field
          label={es.habitForm.ifThen}
          placeholder={es.habitForm.ifThenPlaceholder}
          value={ifThen}
          onChangeText={setIfThen}
          multiline
        />

        <Card>
          <View style={styles.switchRow}>
            <T style={[styles.label, styles.flex]}>{es.habitForm.reminderOn}</T>
            <Switch
              accessibilityLabel={es.habitForm.reminderOn}
              value={reminderOn}
              onValueChange={(v) => void toggleReminder(v)}
              trackColor={{ true: c.primary, false: c.border }}
            />
          </View>
          {reminderOn ? (
            <>
              <T style={styles.label}>{es.habitForm.reminderTime}</T>
              <TimeWheel value={normalizeTime(reminderTime) ?? '20:00'} onChange={setReminderTime} />
              <T style={styles.label}>{es.habitForm.reminderDays}</T>
              <T variant="small">{es.habitForm.reminderDaysHelp}</T>
              <MultiChips options={WEEKDAY_OPTIONS} values={reminderDays} onChange={setReminderDays} />
              {permissionDenied && notificationsSupported ? (
                <T variant="small" color={c.warnText}>
                  {es.habitForm.reminderPermissionDenied}
                </T>
              ) : null}
            </>
          ) : null}
        </Card>

        {rules.length > 0 ? (
          <View style={styles.block}>
            <T style={styles.label}>{es.habitForm.rule}</T>
            <ChoiceChips
              options={rules.map((r) => ({ value: r.id, label: r.thought }))}
              value={ruleId}
              onChange={setRuleId}
            />
          </View>
        ) : null}

        <View style={styles.block}>
          <T style={styles.label}>{es.habitForm.autoLink}</T>
          <ChoiceChips
            options={[
              { value: 'none' as const, label: es.habitForm.autoLinkNone },
              { value: 'opening' as const, label: es.habitForm.autoLinkOpening },
              { value: 'closing' as const, label: es.habitForm.autoLinkClosing },
            ]}
            value={autoLink}
            onChange={(v) => setAutoLink(v ?? 'none')}
            allowNone={false}
          />
        </View>

        <DateStepper label={es.habitForm.startDate} value={startDate} onChange={setStartDate} />
        <View style={styles.row}>
          <View style={styles.phase}>
            <Field
              label={es.habitForm.phase}
              placeholder={es.habitForm.phasePlaceholder}
              value={phase}
              onChangeText={setPhase}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        {existing ? (
          <View style={styles.block}>
            <Button
              kind="ghost"
              label={existing.archived ? es.habitForm.unarchive : es.habitForm.archive}
              onPress={toggleArchived}
            />
            <Button kind="ghost" label={es.common.delete} onPress={() => void remove()} />
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  label: { fontWeight: '600' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  phase: { width: 110 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
