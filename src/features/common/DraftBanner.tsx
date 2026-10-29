import { StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { T } from '../../ui/Text';
import { spacing } from '../../ui/theme';

export function DraftBanner({ onDiscard }: { onDiscard: () => void }) {
  return (
    <Card tone="soft" style={styles.card}>
      <T style={styles.text}>{es.common.draftRestored}</T>
      <View>
        <Button small kind="ghost" label={es.common.discardDraft} onPress={onDiscard} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  text: { flex: 1 },
});
