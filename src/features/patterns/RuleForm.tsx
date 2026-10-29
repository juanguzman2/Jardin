import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { createRule, getRule, updateRule } from '../../db/rules';
import { Button } from '../../ui/Button';
import { MultiChips } from '../../ui/Choice';
import { Field } from '../../ui/Field';
import { Screen } from '../../ui/Screen';
import { T } from '../../ui/Text';
import { spacing } from '../../ui/theme';
import { useAreas } from '../common/useAreas';

const TEXT_FIELDS = [
  ['typicalAction', es.ruleForm.typicalAction, es.ruleForm.typicalActionPlaceholder],
  ['reinforcement', es.ruleForm.reinforcement, es.ruleForm.reinforcementPlaceholder],
  ['consequence', es.ruleForm.consequence, es.ruleForm.consequencePlaceholder],
  ['functionalRule', es.ruleForm.functionalRule, es.ruleForm.functionalRulePlaceholder],
  ['oppositeAction', es.ruleForm.oppositeAction, es.ruleForm.oppositeActionPlaceholder],
] as const;

type TextKey = (typeof TEXT_FIELDS)[number][0];

export function RuleForm({ id }: { id: string }) {
  const isNew = id === 'new';
  const [existing] = useState(() => (isNew ? undefined : getRule(id)));
  const { options } = useAreas();
  const [thought, setThought] = useState(existing?.thought ?? '');
  const [texts, setTexts] = useState<Record<TextKey, string>>({
    typicalAction: existing?.typicalAction ?? '',
    reinforcement: existing?.reinforcement ?? '',
    consequence: existing?.consequence ?? '',
    functionalRule: existing?.functionalRule ?? '',
    oppositeAction: existing?.oppositeAction ?? '',
  });
  const [areaIds, setAreaIds] = useState<string[]>(existing?.areaIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!thought.trim()) {
      setError(es.common.required);
      return;
    }
    const data = {
      thought: thought.trim(),
      typicalAction: texts.typicalAction.trim() || null,
      reinforcement: texts.reinforcement.trim() || null,
      consequence: texts.consequence.trim() || null,
      functionalRule: texts.functionalRule.trim() || null,
      oppositeAction: texts.oppositeAction.trim() || null,
    };
    if (existing) {
      updateRule(existing.id, data, areaIds);
      router.back();
    } else {
      const newId = createRule(data, areaIds);
      router.replace({ pathname: '/rule/[id]', params: { id: newId } });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? es.ruleForm.newTitle : es.ruleForm.editTitle }} />
      <Screen footer={<Button label={es.common.save} onPress={save} />}>
        <Field
          label={es.ruleForm.thought}
          placeholder={es.ruleForm.thoughtPlaceholder}
          value={thought}
          onChangeText={setThought}
          error={error}
          autoFocus={isNew}
        />
        {TEXT_FIELDS.map(([key, label, placeholder]) => (
          <Field
            key={key}
            label={label}
            placeholder={placeholder}
            value={texts[key]}
            onChangeText={(t) => setTexts((s) => ({ ...s, [key]: t }))}
            multiline
          />
        ))}
        <View style={styles.block}>
          <T style={styles.label}>{es.ruleForm.areas}</T>
          <MultiChips options={options} values={areaIds} onChange={setAreaIds} />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  label: { fontWeight: '600' },
});
