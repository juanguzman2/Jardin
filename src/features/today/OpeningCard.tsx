import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { addCommitment, completeOpening, deleteCommitment, updateDay } from '../../db/days';
import type { DayCommitment, DayEntry, PersonalValue } from '../../db/schema';
import { MAX_COMMITMENTS } from '../../domain/balance';
import { Button } from '../../ui/Button';
import { Card, Collapsible } from '../../ui/Card';
import { ChoiceChips } from '../../ui/Choice';
import { toast } from '../../ui/feedback';
import { Field } from '../../ui/Field';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { useAreas } from '../common/useAreas';

export function OpeningCard({
  day,
  isToday,
  entry,
  values,
  commitments,
}: {
  day: string;
  isToday: boolean;
  entry: DayEntry | undefined;
  values: PersonalValue[];
  commitments: DayCommitment[];
}) {
  const { c } = useTheme();
  const { options, nameOf } = useAreas();
  const [text, setText] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [tooMany, setTooMany] = useState(false);
  const done = !!entry?.openingDoneAt;
  const full = commitments.length >= MAX_COMMITMENTS;

  const add = () => {
    if (full) {
      setTooMany(true);
      return;
    }
    if (addCommitment(day, text, areaId)) {
      setText('');
      setAreaId(null);
    }
  };

  return (
    <Collapsible
      key={day}
      title={es.today.opening.title}
      subtitle={done ? es.today.opening.done : undefined}
      defaultOpen={!done && isToday}
    >
      <View style={styles.block}>
        <T variant="label">{es.today.opening.myValues}</T>
        {values.length === 0 ? (
          <T variant="muted">{es.today.opening.noValues}</T>
        ) : (
          values.map((v) => (
            <T key={v.id} style={styles.value}>
              · {v.text}
            </T>
          ))
        )}
        {values.length > 0 ? (
          <Button
            kind={entry?.valuesRead ? 'ghost' : 'secondary'}
            small
            label={entry?.valuesRead ? es.today.opening.valuesRead : es.today.opening.readValues}
            onPress={() => updateDay(day, { valuesRead: !entry?.valuesRead })}
            style={styles.alignStart}
          />
        ) : null}
      </View>

      <View style={styles.block}>
        <T variant="heading">{es.today.opening.question}</T>
        {commitments.map((cm) => (
          <View key={cm.id} style={[styles.commitment, { borderColor: c.border }]}>
            <View style={styles.flex}>
              <T>{cm.text}</T>
              {cm.areaId ? <T variant="small">{nameOf(cm.areaId)}</T> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${es.common.delete}: ${cm.text}`}
              onPress={() => deleteCommitment(cm.id)}
              hitSlop={10}
            >
              <T variant="muted">✕</T>
            </Pressable>
          </View>
        ))}
        {full && tooMany ? (
          <Card tone="soft">
            <T>{es.today.opening.keepItSimple}</T>
          </Card>
        ) : null}
        <Field
          placeholder={es.today.opening.commitmentPlaceholder}
          value={text}
          onChangeText={(t) => {
            setText(t);
            if (full) setTooMany(true);
          }}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        {text.trim() && !full ? <ChoiceChips options={options} value={areaId} onChange={setAreaId} /> : null}
        {text.trim() ? (
          <Button kind="secondary" small label={es.today.opening.add} onPress={add} style={styles.alignStart} />
        ) : null}
      </View>

      <Button
        label={done ? es.today.opening.completeAgain : es.today.opening.complete}
        kind={done ? 'secondary' : 'primary'}
        onPress={() => {
          completeOpening(day);
          toast(es.today.opening.done);
        }}
      />
    </Collapsible>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  value: { fontSize: 17 },
  alignStart: { alignSelf: 'flex-start' },
  flex: { flex: 1 },
  commitment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: spacing.md,
  },
});
