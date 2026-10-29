import { StyleSheet, View } from 'react-native';

import { T } from '../../ui/Text';
import { radius, spacing, useTheme } from '../../ui/theme';

export function Badge({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'warn' | 'muted' }) {
  const { c } = useTheme();
  const bg = tone === 'primary' ? c.primarySoft : tone === 'warn' ? c.warnSoft : c.cardAlt;
  const fg = tone === 'primary' ? c.primary : tone === 'warn' ? c.warnText : c.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <T variant="small" color={fg} style={styles.text}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  text: { fontWeight: '600' },
});
