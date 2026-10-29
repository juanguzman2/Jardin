import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { today } from '../../domain/dates';

/** Día actual en Bogotá; se actualiza al volver a la app y cada minuto. */
export function useToday(): string {
  const [day, setDay] = useState(today);
  useEffect(() => {
    const refresh = () => setDay(today());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const interval = setInterval(refresh, 60_000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);
  return day;
}
