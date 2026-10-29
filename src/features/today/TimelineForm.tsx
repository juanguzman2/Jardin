import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { createTimelineItem, deleteTimelineItem, getTimelineItem, updateTimelineItem } from '../../db/timeline';
import { currentTime, normalizeTime, today } from '../../domain/dates';
import type { Direction } from '../../domain/types';
import { Button } from '../../ui/Button';
import { ChoiceChips } from '../../ui/Choice';
import { confirm } from '../../ui/feedback';
import { Field } from '../../ui/Field';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing, useTheme } from '../../ui/theme';
import { DraftBanner } from '../common/DraftBanner';
import { useAreas } from '../common/useAreas';
import { useDraftState } from '../common/useDraft';

interface Form {
  date: string;
  time: string;
  activity: string;
  thought: string;
  direction: Direction | null;
  areaId: string | null;
}

export function TimelineForm({ id, date }: { id: string; date?: string }) {
  const { c } = useTheme();
  const isNew = id === 'new';
  const [existing] = useState(() => (isNew ? undefined : getTimelineItem(id)));
  const { options } = useAreas();
  const draft = useDraftState<Form>(`timeline:${id}`, () =>
    existing
      ? {
          date: existing.date,
          time: existing.time,
          activity: existing.activity,
          thought: existing.thought ?? '',
          direction: existing.direction,
          areaId: existing.areaId,
        }
      : { date: date ?? today(), time: currentTime(), activity: '', thought: '', direction: null, areaId: null },
  );
  const f = draft.value;
  const [errors, setErrors] = useState<{ activity?: string; time?: string }>({});

  const directionOptions = (['toward', 'away', 'neutral'] as const).map((d) => ({
    value: d,
    label: es.direction[d],
    color: d === 'toward' ? c.toward : d === 'away' ? c.away : c.neutral,
  }));

  const save = () => {
    const time = normalizeTime(f.time);
    const next = {
      activity: f.activity.trim() ? undefined : es.common.required,
      time: time ? undefined : es.timelineForm.invalidTime,
    };
    setErrors(next);
    if (next.activity || next.time || !time) return;
    const data = {
      date: f.date,
      time,
      activity: f.activity.trim(),
      thought: f.thought.trim() || null,
      direction: f.direction,
      areaId: f.areaId,
    };
    if (existing) updateTimelineItem(existing.id, data);
    else createTimelineItem(data);
    draft.clear();
    router.back();
  };

  const remove = async () => {
    if (!existing || !(await confirm({}))) return;
    draft.clear();
    deleteTimelineItem(existing.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? es.timelineForm.newTitle : es.timelineForm.editTitle }} />
      <Screen
        footer={
          <View style={styles.footer}>
            {existing ? <Button kind="ghost" label={es.common.delete} onPress={() => void remove()} /> : null}
            <Button label={es.common.save} onPress={save} style={styles.flex} />
          </View>
        }
      >
        {draft.restored ? <DraftBanner onDiscard={draft.discard} /> : null}
        <Field
          label={es.timelineForm.activity}
          placeholder={es.timelineForm.activityPlaceholder}
          value={f.activity}
          onChangeText={(activity) => draft.set({ activity })}
          error={errors.activity}
          autoFocus={isNew}
          multiline
        />
        <Field
          label={es.timelineForm.time}
          help={es.timelineForm.timeHelp}
          value={f.time}
          onChangeText={(time) => draft.set({ time })}
          error={errors.time}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        <Field
          label={es.timelineForm.thought}
          value={f.thought}
          onChangeText={(thought) => draft.set({ thought })}
          multiline
        />
        <View style={styles.block}>
          <T style={styles.label}>{es.timelineForm.direction}</T>
          <ChoiceChips options={directionOptions} value={f.direction} onChange={(direction) => draft.set({ direction })} />
        </View>
        <View style={styles.block}>
          <T style={styles.label}>{es.common.area}</T>
          <ChoiceChips options={options} value={f.areaId} onChange={(areaId) => draft.set({ areaId })} />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  block: { gap: spacing.sm },
  label: { fontWeight: '600' },
});
