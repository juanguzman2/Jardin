import { useLocalSearchParams } from 'expo-router';

import { RuleForm } from '../../../src/features/patterns/RuleForm';

export default function RuleEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RuleForm key={id} id={id} />;
}
