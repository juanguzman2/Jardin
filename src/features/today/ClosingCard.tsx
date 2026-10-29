import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { completeClosing, setCommitmentStatus, updateDay } from '../../db/days';
import type { DayCommitment, DayEntry } from '../../db/schema';
import { currentTime } from '../../domain/dates';
import type { CommitmentStatus } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Collapsible } from '../../ui/Card';
import { ChoiceChips, ScalePicker } from '../../ui/Choice';
import { toast } from '../../ui/feedback';
import { AutoSaveField } from '../../ui/Field';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';

/** A partir de esta hora el cierre de hoy aparece abierto. */
const EVENING = '18:00';

type TextKey = 'gratitude1' | 'gratitude2' | 'gratitude3' | 'step' | 'learning';

export function ClosingCard({
  day,
  isToday,
  entry,
  commitments,
}: {
  day: string;
  isToday: boolean;
  entry: DayEntry | undefined;
  commitments: DayCommitment[];
}) {
  const { c } = useTheme();
  const done = !!entry?.closingDoneAt;
  const save = (key: TextKey) => (text: string) => updateDay(day, { [key]: text.trim() || null }, { silent: true });
  const reviewOptions = (['done', 'minimal', 'no'] as const).map((s) => ({
    value: s,
    label: es.commitmentStatus[s],
    color: s === 'no' ? c.neutral : undefined,
  }));

  return (
    <Collapsible
      key={day}
      title={es.today.closing.title}
      subtitle={done ? es.today.closing.done : undefined}
      defaultOpen={!done && (!isToday || currentTime() >= EVENING)}
    >
      <View style={styles.block}>
        <T style={styles.label}>{es.today.closing.gratitude}</T>
        {(['gratitude1', 'gratitude2', 'gratitude3'] as const).map((k, i) => (
          <AutoSaveField
            key={k}
            resetKey={`${day}:${k}`}
            value={entry?.[k]}
            onSave={save(k)}
            placeholder={es.today.closing.gratitudePlaceholder(i + 1)}
          />
        ))}
      </View>
      <AutoSaveField
        resetKey={`${day}:step`}
        label={es.today.closing.step}
        value={entry?.step}
        onSave={save('step')}
        multiline
      />
      <AutoSaveField
        resetKey={`${day}:learning`}
        label={es.today.closing.learning}
        value={entry?.learning}
        onSave={save('learning')}
        multiline
      />

      <View style={styles.block}>
        <T style={styles.label}>{es.today.closing.review}</T>
        {commitments.length === 0 ? <T variant="muted">{es.today.closing.reviewEmpty}</T> : null}
        {commitments.map((cm) => (
          <View key={cm.id} style={styles.review}>
            <T>{cm.text}</T>
            <ChoiceChips
              options={reviewOptions}
              value={cm.status === 'pending' ? null : cm.status}
              onChange={(v) => setCommitmentStatus(cm.id, (v ?? 'pending') as CommitmentStatus)}
            />
          </View>
        ))}
      </View>

      <View style={styles.block}>
        <T style={styles.label}>{es.today.closing.satisfaction}</T>
        <ScalePicker
          min={1}
          max={10}
          value={entry?.satisfaction ?? null}
          onChange={(v) => updateDay(day, { satisfaction: v })}
          label={es.today.closing.satisfaction}
        />
      </View>

      <Button
        label={done ? es.today.closing.completeAgain : es.today.closing.complete}
        kind={done ? 'secondary' : 'primary'}
        onPress={() => {
          completeClosing(day);
          toast(es.today.closing.done);
        }}
      />
    </Collapsible>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  label: { fontWeight: '600' },
  review: { gap: spacing.xs, paddingVertical: spacing.xs },
});
