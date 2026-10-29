import { Text, type TextProps, type TextStyle } from 'react-native';

import { font, useTheme } from './theme';

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'small' | 'label';

const variants: Record<Variant, TextStyle> = {
  title: { fontSize: font.title, fontWeight: '700' },
  heading: { fontSize: font.large, fontWeight: '600' },
  body: { fontSize: font.body, lineHeight: 22 },
  muted: { fontSize: font.body, lineHeight: 22 },
  small: { fontSize: font.small, lineHeight: 18 },
  label: { fontSize: font.small, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
};

export function T({ variant = 'body', style, color, ...props }: TextProps & { variant?: Variant; color?: string }) {
  const { c } = useTheme();
  const tone = color ?? (variant === 'muted' || variant === 'small' || variant === 'label' ? c.muted : c.text);
  return <Text {...props} style={[variants[variant], { color: tone }, style]} />;
}
