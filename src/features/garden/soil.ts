import type { Palette } from '../../ui/theme';

export function soilColors(dark: boolean, _c: Palette): { fill: string; dark: string } {
  return dark ? { fill: '#5E4A38', dark: '#7A6048' } : { fill: '#B08B66', dark: '#8A6A4C' };
}
