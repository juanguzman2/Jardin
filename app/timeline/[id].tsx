import { useLocalSearchParams } from 'expo-router';

import { TimelineForm } from '../../src/features/today/TimelineForm';

export default function TimelineRoute() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  return <TimelineForm key={id} id={id} date={date} />;
}
