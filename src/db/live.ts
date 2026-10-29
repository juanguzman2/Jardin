import { type DependencyList, useMemo } from 'react';
import { create } from 'zustand';

/*
 * Reactividad mínima: cada escritura sube un contador y las lecturas con `useDbQuery`
 * se recalculan. Las consultas de expo-sqlite son síncronas y los datos son pocos,
 * así que recalcular lo visible es barato. La fuente de verdad sigue siendo SQLite.
 */
const useDbVersion = create<{ version: number }>(() => ({ version: 0 }));

export function notifyDbChange(): void {
  useDbVersion.setState((s) => ({ version: s.version + 1 }));
}

export function useDbQuery<T>(query: () => T, deps: DependencyList = []): T {
  const version = useDbVersion((s) => s.version);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(query, [version, ...deps]);
}
