import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { listHabits } from '../../db/habits';
import { useDbQuery } from '../../db/live';
import { listRecordsForRule } from '../../db/records';
import { deleteRule, getRule, setRuleArchived } from '../../db/rules';
import { isPossibleCoreThought, ruleStats } from '../../domain/rules';
import { Button } from '../../ui/Button';
import { Card, SectionTitle } from '../../ui/Card';
import { confirm } from '../../ui/feedback';
import { formatDayShort } from '../../ui/format';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { radius, spacing, useTheme } from '../../ui/theme';
import { RecordRow } from '../records/RecordCard';
import { useAreas } from '../common/useAreas';
import { useToday } from '../common/useToday';
import { Badge } from './CoreBadge';

function DiagramBox({ title, text }: { title: string; text: string | null }) {
  const { c } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: c.cardAlt, borderColor: c.border }]}>
      <T variant="small" style={styles.boxTitle}>
        {title}
      </T>
      <T variant="small" color={c.text}>
        {text || '—'}
      </T>
    </View>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <T variant="heading" style={styles.operator}>
      {symbol}
    </T>
  );
}

export function RuleDetail({ id }: { id: string }) {
  const { c } = useTheme();
  const today = useToday();
  const { nameOf } = useAreas();
  const rule = useDbQuery(() => getRule(id), [id]);
  const records = useDbQuery(() => listRecordsForRule(id), [id]);
  const habits = useDbQuery(() => listHabits().filter((h) => h.ruleId === id), [id]);

  if (!rule) {
    return (
      <Screen>
        <T variant="muted">—</T>
      </Screen>
    );
  }

  const stats = ruleStats(rule, records, today);
  const answered = stats.followed + stats.opposite;
  const maxWeek = Math.max(1, ...stats.trend.map((w) => w.appearances));

  const remove = async () => {
    if (!(await confirm({}))) return;
    deleteRule(rule.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: es.tabs.patterns }} />
      <Screen>
        <T variant="title">“{rule.thought}”</T>
        {isPossibleCoreThought(rule) ? <Badge label={es.patterns.coreThought} tone="warn" /> : null}

        <View style={styles.diagram}>
          <DiagramBox title={es.ruleDetail.diagramThought} text={rule.thought} />
          <Operator symbol="+" />
          <DiagramBox title={es.ruleDetail.diagramAction} text={rule.typicalAction} />
          <Operator symbol="=" />
          <DiagramBox title={es.ruleDetail.diagramReinforcement} text={rule.reinforcement} />
        </View>

        {rule.consequence ? (
          <Card>
            <T variant="label">{es.ruleDetail.consequence}</T>
            <T>{rule.consequence}</T>
          </Card>
        ) : null}
        {rule.functionalRule || rule.oppositeAction ? (
          <Card tone="soft">
            {rule.functionalRule ? (
              <>
                <T variant="label">{es.ruleDetail.functionalRule}</T>
                <T style={styles.strong}>{rule.functionalRule}</T>
              </>
            ) : null}
            {rule.oppositeAction ? (
              <>
                <T variant="label">{es.ruleDetail.oppositeAction}</T>
                <T>{rule.oppositeAction}</T>
              </>
            ) : null}
          </Card>
        ) : null}

        {rule.areaIds.length > 0 ? (
          <View style={styles.areas}>
            <T variant="small">{es.ruleDetail.areas}:</T>
            {rule.areaIds.map((a) => (
              <Badge key={a} label={nameOf(a) ?? a} tone="muted" />
            ))}
          </View>
        ) : null}

        <SectionTitle>{es.ruleDetail.stats}</SectionTitle>
        <Card>
          <T>
            {es.ruleDetail.appearances}: <T style={styles.strong}>{stats.appearances}</T>
          </T>
          {answered === 0 ? (
            <T variant="small">{es.ruleDetail.noAnswers}</T>
          ) : (
            <>
              <View style={[styles.bar, { backgroundColor: c.none }]}>
                {stats.opposite > 0 ? <View style={{ flex: stats.opposite, backgroundColor: c.toward }} /> : null}
                {stats.followed > 0 ? <View style={{ flex: stats.followed, backgroundColor: c.neutral }} /> : null}
              </View>
              <T variant="small">
                {es.ruleDetail.opposite}: {stats.opposite} ({stats.oppositePct} %) · {es.ruleDetail.followed}:{' '}
                {stats.followed}
              </T>
            </>
          )}
          <T variant="label">{es.ruleDetail.trend}</T>
          <View style={styles.trend}>
            {stats.trend.map((w) => (
              <View key={w.weekStart} style={styles.week}>
                <T variant="small" style={styles.weekCount}>
                  {w.appearances}
                </T>
                <View style={[styles.weekTrack, { backgroundColor: c.none }]}>
                  <View
                    style={{
                      height: `${(w.appearances / maxWeek) * 100}%`,
                      backgroundColor: w.opposite >= w.followed && w.appearances > 0 ? c.toward : c.neutral,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <T variant="small">{es.ruleDetail.weekOf(formatDayShort(w.weekStart))}</T>
              </View>
            ))}
          </View>
        </Card>

        {habits.length > 0 ? (
          <>
            <SectionTitle>{es.ruleDetail.habitsLinked}</SectionTitle>
            <Card>
              {habits.map((h) => (
                <T key={h.id}>· {h.name}</T>
              ))}
            </Card>
          </>
        ) : null}

        <SectionTitle>{es.ruleDetail.linked}</SectionTitle>
        {records.length === 0 ? (
          <Card>
            <T variant="muted">{es.ruleDetail.linkedEmpty}</T>
          </Card>
        ) : (
          records.map((r) => <RecordRow key={r.id} record={r} showDate areaName={nameOf(r.areaId)} />)
        )}

        <View style={styles.buttons}>
          <Button
            kind="secondary"
            label={es.common.edit}
            onPress={() => router.push({ pathname: '/rule/edit/[id]', params: { id: rule.id } })}
          />
          <Button
            kind="ghost"
            label={rule.archived ? es.ruleForm.unarchive : es.ruleForm.archive}
            onPress={() => setRuleArchived(rule.id, !rule.archived)}
          />
          <Button kind="ghost" label={es.common.delete} onPress={() => void remove()} />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  diagram: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  box: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs, minHeight: 90 },
  boxTitle: { fontWeight: '700' },
  operator: { width: 16, textAlign: 'center' },
  strong: { fontWeight: '700' },
  areas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  bar: { height: 14, borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  trend: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  week: { flex: 1, alignItems: 'center', gap: spacing.xs },
  weekCount: { fontWeight: '600' },
  weekTrack: { width: '60%', height: 70, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
});
