import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { es } from '../../copy/es';
import { addDays, isValidDay, mondayOf } from '../../domain/dates';
import { generateAndSharePdf, previousWeek } from '../../export/pdf';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { toast } from '../../ui/feedback';
import { DateStepper } from '../../ui/DateStepper';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { useToday } from '../common/useToday';

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.toggle}>
      <T style={styles.flex}>{label}</T>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: c.primary, false: c.border }} />
    </View>
  );
}

export function ExportPdfScreen() {
  const today = useToday();
  const initial = previousWeek(today);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [includeTimeline, setIncludeTimeline] = useState(false);
  const [includeRules, setIncludeRules] = useState(true);
  const [includeHabits, setIncludeHabits] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!isValidDay(from) || !isValidDay(to) || from > to) {
      setError(es.pdf.invalidRange);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await generateAndSharePdf({ from, to, includeTimeline, includeRules, includeHabits });
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button label={busy ? es.pdf.generating : es.pdf.generate} onPress={() => void generate()} loading={busy} />
      }
    >
      <Card>
        <T variant="heading">{es.pdf.range}</T>
        <View style={styles.row}>
          <Button
            small
            kind="secondary"
            label={es.pdf.lastWeek}
            onPress={() => {
              const w = previousWeek(today);
              setFrom(w.from);
              setTo(w.to);
            }}
          />
          <Button
            small
            kind="secondary"
            label={es.pdf.thisWeek}
            onPress={() => {
              setFrom(mondayOf(today));
              setTo(addDays(mondayOf(today), 6) > today ? today : addDays(mondayOf(today), 6));
            }}
          />
        </View>
        <DateStepper label={es.pdf.from} value={from} onChange={setFrom} max={to} />
        <DateStepper label={es.pdf.to} value={to} onChange={setTo} max={today} />
        {error ? <T variant="small">{error}</T> : null}
      </Card>
      <Card>
        <T variant="heading">{es.pdf.sections}</T>
        <Toggle label={es.pdf.includeTimeline} value={includeTimeline} onChange={setIncludeTimeline} />
        <Toggle label={es.pdf.includeRules} value={includeRules} onChange={setIncludeRules} />
        <Toggle label={es.pdf.includeHabits} value={includeHabits} onChange={setIncludeHabits} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
});
