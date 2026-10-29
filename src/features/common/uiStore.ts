import { create } from 'zustand';

/* Estado efímero de la interfaz (se pierde al cerrar la app; la verdad está en SQLite). */

interface UiState {
  /** Día abierto en la pestaña Hoy (null = hoy). */
  todayTabDay: string | null;
  /** Día abierto en la lista de checks de Hábitos (null = hoy). */
  habitsDay: string | null;
  /** Tarjetas de "dos días sin regar" que se ocultaron en esta sesión. */
  dismissedAttention: Record<string, true>;
  /** Área cuya planta acaba de "beber" (animación). */
  lastWateredArea: { areaId: string; at: number } | null;
}

export const useUi = create<UiState>(() => ({
  todayTabDay: null,
  habitsDay: null,
  dismissedAttention: {},
  lastWateredArea: null,
}));
