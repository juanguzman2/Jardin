import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { useDbQuery } from '../../db/live';
import { createRecord, deleteRecord, getRecord, updateRecord } from '../../db/records';
import { createRule, listRules } from '../../db/rules';
import { bogotaIso, currentTime, isoToBogota, isValidDay, normalizeTime, today } from '../../domain/dates';
import type { Direction, FollowedRule } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Collapsible } from '../../ui/Card';
import { ChoiceChips, ScalePicker } from '../../ui/Choice';
import { DateStepper } from '../../ui/DateStepper';
import { confirm } from '../../ui/feedback';
import { Field } from '../../ui/Field';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { TimeWheel } from '../../ui/TimeWheel';
import { spacing, useTheme } from '../../ui/theme';
import { DraftBanner } from '../common/DraftBanner';
import { useAreas } from '../common/useAreas';
import { useDraftState } from '../common/useDraft';

const NEW_RULE = '__new__';

interface Form {
  date: string;
  time: string;
  context: string;
  body: string;
  thought: string;
  action: string;
  intensityBefore: number | null;
  longTerm: string;
  intensityAfter: number | null;
  areaId: string | null;
  direction: Direction | null;
  /** id de la regla, `NEW_RULE` para crear una, o null. */
  ruleId: string | null;
  newRuleThought: string;
  followedRule: FollowedRule | null;
}

export function RecordForm({ id, date }: { id: string; date?: string }) {
  const { c } = useTheme();
  const isNew = id === 'new';
  const [existing] = useState(() => (isNew ? undefined : getRecord(id)));
  const { options: areaOptions } = useAreas();
  const rules = useDbQuery(() => listRules());

  const draft = useDraftState<Form>(`record:${id}`, () => {
    if (existing) {
      const when = isoToBogota(existing.occurredAt);
      return {
        date: when.date,
        time: when.time,
        context: existing.context,
        body: existing.body ?? '',
        thought: existing.thought ?? '',
        action: existing.action ?? '',
        intensityBefore: existing.intensityBefore,
        longTerm: existing.longTerm ?? '',
        intensityAfter: existing.intensityAfter,
        areaId: existing.areaId,
        direction: existing.direction,
        ruleId: existing.ruleId,
        newRuleThought: '',
        followedRule: existing.followedRule,
      };
    }
    return {
      date: date ?? today(),
      time: currentTime(),
      context: '',
      body: '',
      thought: '',
      action: '',
      intensityBefore: null,
      longTerm: '',
      intensityAfter: null,
      areaId: null,
      direction: null,
      ruleId: null,
      newRuleThought: '',
      followedRule: null,
    };
  });
  const f = draft.value;
  const [errors, setErrors] = useState<{ context?: string; when?: string }>({});

  const directionOptions = (['toward', 'away', 'neutral'] as const).map((d) => ({
    value: d,
    label: es.direction[d],
    color: d === 'toward' ? c.toward : d === 'away' ? c.away : c.neutral,
  }));
  const ruleOptions = [
    ...rules.map((r) => ({ value: r.id, label: r.thought })),
    { value: NEW_RULE, label: `+ ${es.recordForm.ruleNew}` },
  ];
  // Una regla archivada ya vinculada sigue apareciendo.
  if (f.ruleId && f.ruleId !== NEW_RULE && !rules.some((r) => r.id === f.ruleId) && existing?.ruleId === f.ruleId) {
    ruleOptions.unshift({ value: f.ruleId, label: es.common.archived });
  }
  const followedOptions = (['opposite', 'followed'] as const).map((v) => ({
    value: v,
    label: es.followedRule[v],
    color: v === 'opposite' ? c.toward : c.neutral,
  }));

  const save = () => {
    const time = normalizeTime(f.time);
    const next = {
      context: f.context.trim() ? undefined : es.common.required,
      when: time && isValidDay(f.date) ? undefined : es.recordForm.invalidDate,
    };
    setErrors(next);
    if (next.context || next.when || !time) return;

    let ruleId = f.ruleId === NEW_RULE ? null : f.ruleId;
    if (f.ruleId === NEW_RULE && f.newRuleThought.trim()) {
      ruleId = createRule(
        {
          thought: f.newRuleThought.trim(),
          typicalAction: null,
          reinforcement: null,
          consequence: null,
          functionalRule: null,
          oppositeAction: null,
        },
        f.areaId ? [f.areaId] : [],
      );
    }
    const data = {
      occurredAt: bogotaIso(f.date, time),
      context: f.context.trim(),
      body: f.body.trim() || null,
      thought: f.thought.trim() || null,
      action: f.action.trim() || null,
      longTerm: f.longTerm.trim() || null,
      intensityBefore: f.intensityBefore,
      intensityAfter: f.intensityAfter,
      areaId: f.areaId,
      direction: f.direction,
      ruleId,
      followedRule: ruleId ? f.followedRule : null,
    };
    if (existing) updateRecord(existing.id, data);
    else createRecord(data);
    draft.clear();
    router.back();
  };

  const remove = async () => {
    if (!existing || !(await confirm({}))) return;
    draft.clear();
    deleteRecord(existing.id);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? es.recordForm.newTitle : es.recordForm.editTitle }} />
      <Screen
        footer={
          <View style={styles.row}>
            {existing ? <Button kind="ghost" label={es.common.delete} onPress={() => void remove()} /> : null}
            <Button label={es.common.save} onPress={save} style={styles.flex} />
          </View>
        }
      >
        {draft.restored ? <DraftBanner onDiscard={draft.discard} /> : null}
        <Field
          label={es.recordForm.context}
          placeholder={es.recordForm.contextPlaceholder}
          value={f.context}
          onChangeText={(context) => draft.set({ context })}
          error={errors.context}
          autoFocus={isNew}
          multiline
        />
        <View style={styles.block}>
          <DateStepper label={es.recordForm.when} value={f.date} onChange={(d) => draft.set({ date: d })} max={today()} />
          <TimeWheel value={normalizeTime(f.time) ?? currentTime()} onChange={(time) => draft.set({ time })} shortcuts />
          {errors.when ? (
            <T variant="small" color={c.away}>
              {errors.when}
            </T>
          ) : null}
        </View>

        <Collapsible title={es.recordForm.moreDetails} defaultOpen>
          <Field
            label={es.recordForm.body}
            help={es.recordForm.bodyHelp}
            value={f.body}
            onChangeText={(body) => draft.set({ body })}
            multiline
          />
          <Field label={es.recordForm.thought} value={f.thought} onChangeText={(thought) => draft.set({ thought })} multiline />
          <Field
            label={es.recordForm.action}
            help={es.recordForm.actionHelp}
            value={f.action}
            onChangeText={(action) => draft.set({ action })}
            multiline
          />
          <View style={styles.block}>
            <T style={styles.label}>{es.recordForm.intensityBefore}</T>
            <ScalePicker
              min={0}
              max={10}
              value={f.intensityBefore}
              onChange={(intensityBefore) => draft.set({ intensityBefore })}
              label={es.recordForm.intensityBefore}
            />
          </View>
        </Collapsible>

        <Collapsible title={es.recordForm.rule} defaultOpen>
          <View style={styles.block}>
            <ChoiceChips options={ruleOptions} value={f.ruleId} onChange={(ruleId) => draft.set({ ruleId })} />
            {f.ruleId === NEW_RULE ? (
              <Field
                placeholder={es.recordForm.ruleNewPlaceholder}
                accessibilityLabel={es.recordForm.ruleNew}
                value={f.newRuleThought}
                onChangeText={(newRuleThought) => draft.set({ newRuleThought })}
              />
            ) : null}
          </View>
          {f.ruleId ? (
            <View style={styles.block}>
              <T style={styles.label}>{es.recordForm.followed}</T>
              <ChoiceChips
                options={followedOptions}
                value={f.followedRule}
                onChange={(followedRule) => draft.set({ followedRule })}
              />
            </View>
          ) : null}
          <View style={styles.block}>
            <T style={styles.label}>{es.common.area}</T>
            <ChoiceChips options={areaOptions} value={f.areaId} onChange={(areaId) => draft.set({ areaId })} />
          </View>
          <View style={styles.block}>
            <T style={styles.label}>{es.recordForm.direction}</T>
            <ChoiceChips options={directionOptions} value={f.direction} onChange={(direction) => draft.set({ direction })} />
          </View>
        </Collapsible>

        <Collapsible title={es.recordForm.later} defaultOpen={!isNew}>
          <Field
            label={es.recordForm.longTerm}
            help={es.recordForm.longTermHelp}
            value={f.longTerm}
            onChangeText={(longTerm) => draft.set({ longTerm })}
            multiline
          />
          <View style={styles.block}>
            <T style={styles.label}>{es.recordForm.intensityAfter}</T>
            <ScalePicker
              min={0}
              max={10}
              value={f.intensityAfter}
              onChange={(intensityAfter) => draft.set({ intensityAfter })}
              label={es.recordForm.intensityAfter}
            />
          </View>
        </Collapsible>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  flex: { flex: 1 },
  block: { gap: spacing.sm },
  label: { fontWeight: '600' },
});
