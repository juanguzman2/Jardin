import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { deleteHabit, setCheck, setCheckNote, updateHabit } from '../../db/habits';
import type { Habit, HabitCheck } from '../../db/schema';
import { currentTime, mondayOf } from '../../domain/dates';
import { computeFlexibleStreak, habitDayOf, hasFirmRoots, isFulfilled, weeklyCompliance } from '../../domain/habits';
import type { CheckStatus } from '../../domain/types';
import { syncHabitReminders } from '../../notifications';
import { ActionMenu } from '../../ui/ActionMenu';
import { Card } from '../../ui/Card';
import { confirm, toast } from '../../ui/feedback';
import { AutoSaveField } from '../../ui/Field';
import { T } from '../../ui/Text';
import { radius, spacing, touch, useTheme } from '../../ui/theme';
import { Badge } from '../patterns/CoreBadge';
import { useUi } from '../common/uiStore';

/** Desde esta hora, un hábito de hoy sin marcar muestra el recordatorio suave. */
const EVENING = '18:00';

function StatusButton({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.status,
        {
          backgroundColor: selected ? color : c.cardAlt,
          borderColor: selected ? color : c.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <T style={styles.statusText} color={selected ? c.primaryText : c.text}>
        {label}
      </T>
    </Pressable>
  );
}

export function HabitCheckCard({
  habit,
  checks,
  day,
  today,
  ruleReminder,
  areaName,
}: {
  habit: Habit;
  checks: HabitCheck[];
  day: string;
  today: string;
  ruleReminder: string | null;
  areaName: string | null;
}) {
  const { c } = useTheme();
  const check = checks.find((ch) => ch.habitId === habit.id && ch.date === day);
  const status = check?.status ?? null;
  const streak = computeFlexibleStreak(habit, checks, today);
  const firm = hasFirmRoots(habit, checks);
  const weekly =
    habit.frequencyType === 'times_per_week' ? weeklyCompliance(habit, checks, mondayOf(day), day) : null;
  const [noteOpen, setNoteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dayOf = habitDayOf(habit, day);

  const edit = () => router.push({ pathname: '/habit/[id]', params: { id: habit.id } });
  const archive = () => {
    updateHabit(habit.id, { archived: true });
    syncHabitReminders().catch(() => undefined);
    toast(es.common.archived);
  };
  const remove = async () => {
    if (!(await confirm({ title: es.habits.deleteTitle(habit.name), message: es.habitForm.deleteBody }))) return;
    deleteHabit(habit.id);
    syncHabitReminders().catch(() => undefined);
  };

  const mark = (next: CheckStatus) => {
    const value = status === next ? null : next;
    setCheck(habit.id, day, value);
    if (isFulfilled(value)) useUi.setState({ lastWateredArea: { areaId: habit.areaId, at: Date.now() } });
  };

  const showGentle = !status && day === today && currentTime() >= EVENING;

  return (
    <Card>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${es.common.edit}: ${habit.name}`}
          onPress={edit}
          onLongPress={() => setMenuOpen(true)}
          style={styles.flex}
        >
          <T variant="heading">{habit.name}</T>
          <T variant="small">
            {[
              areaName,
              dayOf ? es.habits.dayOf(dayOf.day, dayOf.total) : null,
              es.habits.streak(streak.current, streak.unit),
              es.habits.longest(streak.longest),
            ]
              .filter(Boolean)
              .join(' · ')}
          </T>
        </Pressable>
        {firm ? <Badge label={es.habits.firmRoots} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${es.habits.options}: ${habit.name}`}
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          style={styles.dots}
        >
          <T variant="heading" color={c.muted}>
            ⋯
          </T>
        </Pressable>
      </View>

      {habit.minimalVersion ? (
        <T variant="small">
          {es.habits.minimal}: <T variant="small" color={c.text}>{habit.minimalVersion}</T>
        </T>
      ) : null}
      {!status && ruleReminder ? (
        <View style={[styles.reminder, { backgroundColor: c.primarySoft }]}>
          <T variant="small" color={c.primary} style={styles.reminderText}>
            {es.habits.ruleReminder}: {ruleReminder}
          </T>
        </View>
      ) : null}
      {showGentle ? <T variant="small">{es.habits.notWateredToday}</T> : null}

      <View style={styles.buttons}>
        <StatusButton label={es.checkStatus.done} selected={status === 'done'} onPress={() => mark('done')} color={c.primary} />
        <StatusButton
          label={es.checkStatus.minimal}
          selected={status === 'minimal'}
          onPress={() => mark('minimal')}
          color={c.minimal}
        />
        <StatusButton label={es.checkStatus.no} selected={status === 'no'} onPress={() => mark('no')} color={c.neutral} />
      </View>

      {weekly ? <T variant="small">{es.habits.weekProgress(weekly.fulfilled, weekly.expected)}</T> : null}

      {check ? (
        noteOpen || check.note ? (
          <AutoSaveField
            resetKey={`${habit.id}:${day}`}
            value={check.note}
            onSave={(t) => setCheckNote(habit.id, day, t)}
            placeholder={es.habits.notePlaceholder}
            accessibilityLabel={`${es.habits.note}: ${habit.name}`}
          />
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setNoteOpen(true)} hitSlop={6}>
            <T variant="small" color={c.primary}>
              + {es.habits.addNote}
            </T>
          </Pressable>
        )
      ) : null}
      <ActionMenu
        visible={menuOpen}
        title={habit.name}
        onClose={() => setMenuOpen(false)}
        actions={[
          { label: es.common.edit, onPress: edit },
          { label: es.habits.archive, onPress: archive },
          { label: es.common.delete, destructive: true, onPress: () => void remove() },
        ]}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  dots: { paddingHorizontal: spacing.xs, minHeight: 32, justifyContent: 'center' },
  reminder: { borderRadius: radius.sm, padding: spacing.sm },
  reminderText: { fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  status: {
    flex: 1,
    minHeight: touch,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontWeight: '600' },
});
