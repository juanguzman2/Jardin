import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { listChecks, listHabits, listObstacleNotes } from '../../db/habits';
import { useDbQuery } from '../../db/live';
import { listRules } from '../../db/rules';
import { computeFlexibleStreak, habitPhase, isScheduled } from '../../domain/habits';
import { Button } from '../../ui/Button';
import { Card, SectionTitle } from '../../ui/Card';
import { DayNav } from '../../ui/DayNav';
import { formatDayShort } from '../../ui/format';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { useAreas } from '../common/useAreas';
import { useUi } from '../common/uiStore';
import { useToday } from '../common/useToday';
import { Garden } from '../garden/Garden';
import { AttentionCard } from './AttentionCard';
import { HabitCheckCard } from './HabitCheckCard';

export function HabitsScreen() {
  const { c } = useTheme();
  const today = useToday();
  const selected = useUi((s) => s.habitsDay);
  const dismissed = useUi((s) => s.dismissedAttention);
  const day = selected && selected < today ? selected : today;
  const setDay = (d: string) => useUi.setState({ habitsDay: d >= today ? null : d });
  const [showArchived, setShowArchived] = useState(false);

  const habits = useDbQuery(() => listHabits({ includeArchived: true }));
  const checks = useDbQuery(() => listChecks());
  const rules = useDbQuery(() => listRules({ includeArchived: true }));
  const obstacles = useDbQuery(() => listObstacleNotes());
  const { nameOf } = useAreas();

  const active = habits.filter((h) => !h.archived);
  // Archivados, con periodo ya terminado o que aún no empiezan: no salen en el riego de hoy.
  const inactive = habits.filter((h) => h.archived || habitPhase(h, today) !== 'active');
  const statusOf = (h: (typeof habits)[number]) =>
    h.archived
      ? es.common.archived
      : habitPhase(h, today) === 'finished'
        ? es.habits.finished
        : es.habits.upcoming(formatDayShort(h.startDate));
  const dayHabits = active.filter((h) => isScheduled(h, day));
  const reminderOf = (ruleId: string | null) => {
    const rule = ruleId ? rules.find((r) => r.id === ruleId) : undefined;
    return rule ? (rule.functionalRule ?? rule.oppositeAction ?? rule.thought) : null;
  };

  const attention =
    day === today
      ? active
          .map((habit) => ({ habit, streak: computeFlexibleStreak(habit, checks, today) }))
          .filter(
            ({ habit, streak }) =>
              streak.needsAttention &&
              !checks.some((ch) => ch.habitId === habit.id && ch.date === today) &&
              !dismissed[`${habit.id}:${today}`] &&
              !obstacles.some((o) => o.habitId === habit.id && o.date === today),
          )
      : [];

  return (
    <Screen>
      <SectionTitle>{es.habits.gardenTitle}</SectionTitle>
      <Garden habits={habits} checks={checks} today={today} />

      <SectionTitle>{es.habits.checksTitle}</SectionTitle>
      <DayNav day={day} today={today} onChange={setDay} />

      {attention.map(({ habit, streak }) => (
        <AttentionCard key={habit.id} habit={habit} unit={streak.unit} today={today} />
      ))}

      {dayHabits.length === 0 ? (
        <Card>
          <T variant="muted">{es.habits.empty}</T>
        </Card>
      ) : (
        dayHabits.map((h) => (
          <HabitCheckCard
            key={h.id}
            habit={h}
            checks={checks}
            day={day}
            today={today}
            ruleReminder={reminderOf(h.ruleId)}
            areaName={nameOf(h.areaId)}
          />
        ))
      )}

      <Button
        kind="secondary"
        label={`+ ${es.habits.newHabit}`}
        onPress={() => router.push({ pathname: '/habit/[id]', params: { id: 'new' } })}
      />

      {inactive.length > 0 ? (
        <View style={styles.archived}>
          <Button
            kind="ghost"
            small
            label={showArchived ? es.habits.hideInactive : es.habits.showInactive(inactive.length)}
            onPress={() => setShowArchived(!showArchived)}
          />
          {showArchived
            ? inactive.map((h) => (
                <Pressable
                  key={h.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${es.common.edit}: ${h.name}`}
                  onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
                  style={[styles.archivedRow, { borderColor: c.border }]}
                >
                  <T>{h.name}</T>
                  <T variant="small">{[nameOf(h.areaId), statusOf(h)].filter(Boolean).join(' · ')}</T>
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  archived: { gap: spacing.sm },
  archivedRow: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: spacing.md },
});
