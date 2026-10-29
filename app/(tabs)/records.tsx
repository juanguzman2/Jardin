import { Screen } from '../../src/ui/Screen';
import { T } from '../../src/ui/Text';
import { useDbQuery } from '../../src/db/live';
import { listHabits } from '../../src/db/habits';
import { listRules } from '../../src/db/rules';
import { listAreas } from '../../src/db/areas';

export default function Placeholder() {
  const habits = useDbQuery(() => listHabits());
  const rules = useDbQuery(() => listRules());
  const areas = useDbQuery(() => listAreas());
  return (
    <Screen>
      <T>records: {areas.length} áreas, {habits.length} hábitos, {rules.length} reglas</T>
      {habits.map((h) => <T key={h.id}>{h.name}</T>)}
    </Screen>
  );
}
