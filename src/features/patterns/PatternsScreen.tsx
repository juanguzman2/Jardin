import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { useDbQuery } from '../../db/live';
import { listRecords } from '../../db/records';
import { listRules, type RuleWithAreas } from '../../db/rules';
import { isPossibleCoreThought, ruleStats } from '../../domain/rules';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { radius, spacing, useTheme } from '../../ui/theme';
import { useToday } from '../common/useToday';
import { Badge } from './CoreBadge';

function RuleCard({ rule, appearances, oppositePct }: { rule: RuleWithAreas; appearances: number; oppositePct: number | null }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rule.thought}
      onPress={() => router.push({ pathname: '/rule/[id]', params: { id: rule.id } })}
      style={({ pressed }) => [styles.card, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.75 : 1 }]}
    >
      <T variant="heading">“{rule.thought}”</T>
      {rule.functionalRule ? (
        <T variant="small" color={c.primary}>
          → {rule.functionalRule}
        </T>
      ) : null}
      <View style={styles.meta}>
        {isPossibleCoreThought(rule) ? <Badge label={es.patterns.coreThought} tone="warn" /> : null}
        {rule.archived ? <Badge label={es.common.archived} tone="muted" /> : null}
        <T variant="small">{es.patterns.appearances(appearances)}</T>
        {oppositePct !== null ? <T variant="small">· {es.patterns.oppositePct(oppositePct)}</T> : null}
      </View>
    </Pressable>
  );
}

export function PatternsScreen() {
  const today = useToday();
  const [showArchived, setShowArchived] = useState(false);
  const rules = useDbQuery(() => listRules({ includeArchived: true }));
  const records = useDbQuery(() => listRecords());
  const visible = rules.filter((r) => showArchived || !r.archived);
  const archivedCount = rules.filter((r) => r.archived).length;

  return (
    <Screen>
      <Card tone="soft">
        <T variant="heading">{es.patterns.title}</T>
        <T variant="small">{es.patterns.intro}</T>
      </Card>
      <Button
        label={es.patterns.newRule}
        onPress={() => router.push({ pathname: '/rule/edit/[id]', params: { id: 'new' } })}
      />
      {visible.length === 0 ? (
        <Card>
          <T variant="muted">{es.patterns.empty}</T>
        </Card>
      ) : (
        visible.map((r) => {
          const stats = ruleStats(r, records, today);
          return <RuleCard key={r.id} rule={r} appearances={stats.appearances} oppositePct={stats.oppositePct} />;
        })
      )}
      {archivedCount > 0 ? (
        <Button
          kind="ghost"
          label={showArchived ? es.patterns.hideArchived : `${es.patterns.showArchived} (${archivedCount})`}
          onPress={() => setShowArchived(!showArchived)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
});
