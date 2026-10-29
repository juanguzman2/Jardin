import { useLocalSearchParams } from 'expo-router';

import { AreaDetail } from '../../src/features/garden/AreaDetail';

export default function AreaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AreaDetail id={id} />;
}
