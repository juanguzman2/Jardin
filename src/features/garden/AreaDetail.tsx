import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { listAreas } from '../../db/areas';
import { listChecks, listHabits } from '../../db/habits';
import { useDbQuery } from '../../db/live';
import { addDays, mondayOf } from '../../domain/dates';
import { type AreaDayStatus, areaDayStatus, daysToNextStage, gardenStage } from '../../domain/garden';
import { computeFlexibleStreak, hasFirmRoots, weeklyCompliance } from '../../domain/habits';
import { Button } from '../../ui/Button';
import { Card, SectionTitle } from '../../ui/Card';
import { formatDayShort, WEEKDAY_SHORT } from '../../ui/format';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { useToday } from '../common/useToday';
import { Badge } from '../patterns/CoreBadge';
import { Plant } from './Plant';
import { soilColors } from './soil';
import { areaGarden } from './useGarden';

const WEEKS = 8;

function Square({ status }: { status: AreaDayStatus | 'future' }) {
  const { c } = useTheme();
  const bg = status === 'watered' ? c.toward : status === 'dry' ? c.dry : status === 'none' ? c.none : 'transparent';
  return <View style={[styles.square, { backgroundColor: bg }]} />;
}

export function AreaDetail({ id }: { id: string }) {
  const { c, dark } = useTheme();
  const today = useToday();
  const area = useDbQuery(() => listAreas().find((a) => a.id === id), [id]);
  const habits = useDbQuery(() => listHabits({ includeArchived: true }));
  const checks = useDbQuery(() => listChecks());
  const garden = useDbQuery(() => (area ? areaGarden(area, habits, checks, today) : null), [area, habits, checks, today]);

  if (!area || !garden) {
    return (
      <Screen>
        <T variant="muted">—</T>
      </Screen>
    );
  }

  const next = daysToNextStage(garden.wateredDays);
  const nextStage = next !== null ? gardenStage(garden.wateredDays + next) : null;
  const ratio = garden.hydration.ratio;
  const thisMonday = mondayOf(today);
  const lastMonday = addDays(thisMonday, -7);
  const firstMonday = addDays(thisMonday, -7 * (WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, i) => addDays(firstMonday, 7 * i));
  const areaHabits = habits.filter((h) => h.areaId === id);

  return (
    <>
      <Stack.Screen options={{ title: area.name }} />
      <Screen>
        <Card style={styles.hero}>
          <Plant
            stage={garden.unplanted ? 'unplanted' : garden.stage}
            hydration={garden.hydration.level}
            firmRoots={garden.firmRoots}
            size={170}
            soil={soilColors(dark, c)}
          />
          <T variant="title">{garden.unplanted ? es.habits.unplanted : es.stages[garden.stage]}</T>
          <T variant="muted">{es.area.wateredDays(garden.wateredDays)}</T>
          <T variant="small" style={styles.center}>
            {next !== null && nextStage ? es.area.nextStage(next, es.stages[nextStage]) : es.area.fullBloom}
          </T>
          <T variant="small">
            {es.area.hydration}: {es.hydration[garden.hydration.level]}
            {ratio !== null ? ` (${Math.round(ratio * 100)} %)` : ''}
          </T>
        </Card>

        <T variant="small" style={styles.center}>
          {es.area.metaphor}
        </T>

        <SectionTitle>{es.area.habits}</SectionTitle>
        {garden.activeHabits.length === 0 ? (
          <Card>
            <T variant="muted">{es.area.noHabits}</T>
          </Card>
        ) : (
          garden.activeHabits.map((h) => {
            const streak = computeFlexibleStreak(h, checks, today);
            const thisWeek = weeklyCompliance(h, checks, thisMonday, today);
            const lastWeek = weeklyCompliance(h, checks, lastMonday, today);
            return (
              <Card key={h.id}>
                <View style={styles.habitHeader}>
                  <T variant="heading" style={styles.flex}>
                    {h.name}
                  </T>
                  {hasFirmRoots(h, checks) ? <Badge label={es.habits.firmRoots} /> : null}
                </View>
                <T variant="small">
                  {es.habits.streak(streak.current, streak.unit)} · {es.habits.longest(streak.longest)}
                </T>
                <T variant="small">
                  {es.area.thisWeek}: {thisWeek ? `${thisWeek.fulfilled}/${thisWeek.expected}` : '—'} ·{' '}
                  {es.area.lastWeek}: {lastWeek ? `${lastWeek.fulfilled}/${lastWeek.expected}` : '—'}
                </T>
                <Button
                  kind="ghost"
                  small
                  label={es.common.edit}
                  onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
                  style={styles.alignStart}
                />
              </Card>
            );
          })
        )}

        <SectionTitle>{es.area.map}</SectionTitle>
        <Card>
          <View style={styles.map}>
            <View style={styles.dayLabels}>
              <View style={styles.weekLabel} />
              {WEEKDAY_SHORT.map((d) => (
                <T key={d} variant="small" style={styles.dayLabel}>
                  {d}
                </T>
              ))}
            </View>
            {weeks.map((monday) => (
              <View key={monday} style={styles.week}>
                <T variant="small" style={styles.weekLabel} numberOfLines={1}>
                  {formatDayShort(monday).split(' ')[0]}
                </T>
                {Array.from({ length: 7 }, (_, d) => {
                  const day = addDays(monday, d);
                  return (
                    <Square key={day} status={day > today ? 'future' : areaDayStatus(id, areaHabits, checks, day, today)} />
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <Square status="watered" />
            <T variant="small">{es.area.mapLegendWatered}</T>
            <Square status="dry" />
            <T variant="small">{es.area.mapLegendDry}</T>
            <Square status="none" />
            <T variant="small">{es.area.mapLegendNone}</T>
          </View>
        </Card>

        <Button
          kind="secondary"
          label={`+ ${es.habits.newHabit}`}
          onPress={() => router.push({ pathname: '/habit/[id]', params: { id: 'new', area: id } })}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  habitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alignStart: { alignSelf: 'flex-start' },
  map: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabels: { gap: 4 },
  dayLabel: { height: 22, lineHeight: 22, textAlign: 'center', width: 16 },
  week: { gap: 4, alignItems: 'center' },
  weekLabel: { height: 18, fontSize: 11 },
  square: { width: 22, height: 22, borderRadius: 5 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
});
