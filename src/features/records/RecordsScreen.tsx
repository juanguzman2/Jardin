import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { useDbQuery } from '../../db/live';
import { listRecords } from '../../db/records';
import { listRules } from '../../db/rules';
import type { FunctionalRecord } from '../../db/schema';
import { isoToBogota } from '../../domain/dates';
import { filterRecords, pendingRecords } from '../../domain/records';
import { Button } from '../../ui/Button';
import { Card, Collapsible, SectionTitle } from '../../ui/Card';
import { ChoiceChips } from '../../ui/Choice';
import { relativeDayLabel } from '../../ui/format';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing } from '../../ui/theme';
import { useAreas } from '../common/useAreas';
import { useToday } from '../common/useToday';
import { RecordRow } from './RecordCard';

type IntensityRange = 'low' | 'mid' | 'high';
const RANGES: Record<IntensityRange, { min: number; max: number; label: string }> = {
  low: { min: 0, max: 3, label: '0–3' },
  mid: { min: 4, max: 6, label: '4–6' },
  high: { min: 7, max: 10, label: '7–10' },
};

export function RecordsScreen() {
  const today = useToday();
  const records = useDbQuery(() => listRecords());
  const rules = useDbQuery(() => listRules({ includeArchived: true }));
  const { options: areaOptions, nameOf } = useAreas();
  const [areaId, setAreaId] = useState<string | null>(null);
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [range, setRange] = useState<IntensityRange | null>(null);

  const ruleThought = useMemo(() => {
    const map = new Map(rules.map((r) => [r.id, r.thought]));
    return (id: string | null) => (id ? (map.get(id) ?? null) : null);
  }, [rules]);

  // `today` como dependencia: los pendientes se recalculan al pasar el tiempo.
  const pending = useMemo(() => pendingRecords(records, new Date()), [records, today]);
  const filtered = filterRecords(records, {
    areaId,
    ruleId,
    minIntensity: range ? RANGES[range].min : null,
    maxIntensity: range ? RANGES[range].max : null,
  });
  const hasFilters = !!(areaId || ruleId || range);

  const groups: { day: string; items: FunctionalRecord[] }[] = [];
  for (const r of filtered) {
    const day = isoToBogota(r.occurredAt).date;
    const last = groups.at(-1);
    if (last && last.day === day) last.items.push(r);
    else groups.push({ day, items: [r] });
  }

  return (
    <Screen>
      <View style={styles.actions}>
        <Button
          label={es.records.newRecord}
          onPress={() => router.push({ pathname: '/record/[id]', params: { id: 'new' } })}
          style={styles.flex}
        />
        <Button kind="secondary" label="PDF" accessibilityLabel={es.records.exportPdf} onPress={() => router.push('/export-pdf')} />
      </View>

      {pending.length > 0 ? (
        <Card tone="warn">
          <T variant="heading">
            {es.records.pending} ({pending.length})
          </T>
          <T variant="small">{es.records.pendingHelp}</T>
          {pending.slice(0, 5).map((r) => (
            <RecordRow key={r.id} record={r} showDate action={es.records.complete} />
          ))}
        </Card>
      ) : null}

      <Collapsible title={es.records.filters} subtitle={hasFilters ? '•' : undefined} defaultOpen={false}>
        <T variant="label">{es.common.area}</T>
        <ChoiceChips options={areaOptions} value={areaId} onChange={setAreaId} />
        {rules.length > 0 ? (
          <>
            <T variant="label">{es.recordForm.rule}</T>
            <ChoiceChips options={rules.map((r) => ({ value: r.id, label: r.thought }))} value={ruleId} onChange={setRuleId} />
          </>
        ) : null}
        <T variant="label">{es.records.intensity}</T>
        <ChoiceChips
          options={(Object.keys(RANGES) as IntensityRange[]).map((k) => ({ value: k, label: RANGES[k].label }))}
          value={range}
          onChange={setRange}
        />
        {hasFilters ? (
          <Button
            kind="ghost"
            small
            label={es.records.clearFilters}
            onPress={() => {
              setAreaId(null);
              setRuleId(null);
              setRange(null);
            }}
            style={styles.alignStart}
          />
        ) : null}
      </Collapsible>

      {records.length === 0 ? (
        <Card>
          <T variant="muted">{es.records.empty}</T>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <T variant="muted">{es.records.emptyFiltered}</T>
        </Card>
      ) : (
        groups.map((g) => (
          <View key={g.day} style={styles.group}>
            <SectionTitle>{relativeDayLabel(g.day, today)}</SectionTitle>
            {g.items.map((r) => (
              <RecordRow key={r.id} record={r} areaName={nameOf(r.areaId)} ruleThought={ruleThought(r.ruleId)} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  group: { gap: spacing.sm },
  alignStart: { alignSelf: 'flex-start' },
});
