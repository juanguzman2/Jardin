import { useLocalSearchParams } from 'expo-router';

import { HabitForm } from '../../src/features/habits/HabitForm';

export default function HabitRoute() {
  const { id, area } = useLocalSearchParams<{ id: string; area?: string }>();
  return <HabitForm key={id} id={id} areaId={area} />;
}
