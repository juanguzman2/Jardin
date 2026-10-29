import { useMemo } from 'react';

import { listAreas } from '../../db/areas';
import { useDbQuery } from '../../db/live';
import type { Area } from '../../db/schema';
import type { Option } from '../../ui/Choice';

export function useAreas(): { areas: Area[]; options: Option<string>[]; nameOf: (id: string | null) => string | null } {
  const areas = useDbQuery(() => listAreas());
  return useMemo(() => {
    const byId = new Map(areas.map((a) => [a.id, a.name]));
    return {
      areas,
      options: areas.map((a) => ({ value: a.id, label: a.name })),
      nameOf: (id) => (id ? (byId.get(id) ?? null) : null),
    };
  }, [areas]);
}
