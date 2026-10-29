import { useColorScheme } from 'react-native';

/*
 * Tema claro/oscuro según el sistema. Simple y legible: el único elemento con
 * cuidado visual especial es el jardín (src/features/garden).
 * "Me aleja" y los días sin regar NUNCA van en rojo: ocre y gris neutro.
 */

export interface Palette {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  toward: string;
  away: string;
  neutral: string;
  dry: string;
  none: string;
  warnSoft: string;
  warnText: string;
  overlay: string;
}

const light: Palette = {
  bg: '#F6F5F0',
  card: '#FFFFFF',
  cardAlt: '#EFEEE7',
  text: '#1E2420',
  muted: '#646C67',
  border: '#DEDCD3',
  primary: '#2E7A57',
  primaryText: '#FFFFFF',
  primarySoft: '#DCEFE4',
  toward: '#2E7A57',
  away: '#B4782A',
  neutral: '#8A918D',
  dry: '#D3D6D3',
  none: '#ECEBE5',
  warnSoft: '#FBF1DF',
  warnText: '#7A5418',
  overlay: 'rgba(0,0,0,0.35)',
};

const dark: Palette = {
  bg: '#111513',
  card: '#1A201D',
  cardAlt: '#222925',
  text: '#E7ECE9',
  muted: '#9BA49F',
  border: '#2E3632',
  primary: '#5DB88C',
  primaryText: '#0D1A13',
  primarySoft: '#1E3A2C',
  toward: '#5DB88C',
  away: '#DDA65C',
  neutral: '#8C9590',
  dry: '#3A423E',
  none: '#1F2522',
  warnSoft: '#3A2F1C',
  warnText: '#F0CF9A',
  overlay: 'rgba(0,0,0,0.55)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const font = { small: 13, body: 16, large: 18, title: 22, huge: 28 } as const;
/** Altura mínima de un control táctil (botones grandes, uso con una mano). */
export const touch = 48;

export function useTheme(): { c: Palette; dark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { c: isDark ? dark : light, dark: isDark };
}
