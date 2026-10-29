import { useLocalSearchParams } from 'expo-router';

import { RecordForm } from '../../src/features/records/RecordForm';

export default function RecordRoute() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  return <RecordForm key={id} id={id} date={date} />;
}
