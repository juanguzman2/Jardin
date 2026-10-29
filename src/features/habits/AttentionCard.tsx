import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { addObstacleNote } from '../../db/habits';
import type { Habit } from '../../db/schema';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { toast } from '../../ui/feedback';
import { Field } from '../../ui/Field';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { useUi } from '../common/uiStore';

/** Tarjeta suave cuando los dos últimos periodos programados quedaron sin regar. */
export function AttentionCard({ habit, unit, today }: { habit: Habit; unit: 'days' | 'weeks'; today: string }) {
  const { c } = useTheme();
  const [text, setText] = useState('');
  const dismiss = () =>
    useUi.setState((s) => ({ dismissedAttention: { ...s.dismissedAttention, [`${habit.id}:${today}`]: true } }));

  return (
    <Card tone="warn">
      <T style={styles.title} color={c.warnText}>
        {unit === 'weeks' ? es.habits.attentionTitleWeeks(habit.name) : es.habits.attentionTitle(habit.name)}
      </T>
      <T variant="small" color={c.warnText}>
        {es.habits.attentionBody}
        {habit.minimalVersion ? ` (${habit.minimalVersion})` : ''}
      </T>
      <Field
        placeholder={es.habits.obstaclePlaceholder}
        accessibilityLabel={`${es.habits.obstaclePlaceholder}: ${habit.name}`}
        value={text}
        onChangeText={setText}
        multiline
      />
      <View style={styles.row}>
        <Button kind="ghost" small label={es.habits.obstacleLater} onPress={dismiss} />
        <Button
          small
          kind="secondary"
          label={es.habits.obstacleSave}
          disabled={!text.trim()}
          onPress={() => {
            addObstacleNote(habit.id, today, text);
            toast(es.habits.obstacleSaved);
            dismiss();
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
