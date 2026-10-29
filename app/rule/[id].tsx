import { useLocalSearchParams } from 'expo-router';

import { RuleDetail } from '../../src/features/patterns/RuleDetail';

export default function RuleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RuleDetail id={id} />;
}
