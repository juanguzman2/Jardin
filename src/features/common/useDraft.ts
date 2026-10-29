import { useCallback, useEffect, useRef, useState } from 'react';

import { clearDraft, loadDraft, saveDraft } from '../../db/settings';

/**
 * Estado de formulario cuyo borrador se guarda solo (en la tabla `settings`).
 * Si al abrir hay un borrador, se recupera y `restored` queda en true.
 */
export function useDraftState<T extends object>(key: string, initial: () => T) {
  const [state, setState] = useState<{ value: T; restored: boolean }>(() => {
    const draft = loadDraft<T>(key);
    return draft ? { value: { ...initial(), ...draft }, restored: true } : { value: initial(), restored: false };
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(state.value);
  latest.current = state.value;
  const dirty = useRef(false);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (dirty.current) {
      saveDraft(key, latest.current);
      dirty.current = false;
    }
  }, [key]);

  useEffect(() => flush, [flush]);

  const set = useCallback(
    (patch: Partial<T>) => {
      setState((s) => ({ ...s, value: { ...s.value, ...patch } }));
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 400);
    },
    [flush],
  );

  /** Borra el borrador (después de guardar de verdad). */
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    dirty.current = false;
    clearDraft(key);
  }, [key]);

  const discard = useCallback(() => {
    clear();
    setState({ value: initial(), restored: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear]);

  return { value: state.value, restored: state.restored, set, clear, discard };
}
