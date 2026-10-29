import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { es } from '../../copy/es';
import type { TimelineItem } from '../../db/schema';
import { deleteTimelineItem } from '../../db/timeline';
import { dayBalance } from '../../domain/balance';
import type { Direction } from '../../domain/types';
import { ActionMenu } from '../../ui/ActionMenu';
import { Card, SectionTitle } from '../../ui/Card';
import { confirm } from '../../ui/feedback';
import { T } from '../../ui/Text';
import { radius, spacing, useTheme } from '../../ui/theme';
import { useAreas } from '../common/useAreas';

export function DirectionPill({ direction }: { direction: Direction }) {
  const { c } = useTheme();
  const color = direction === 'toward' ? c.toward : direction === 'away' ? c.away : c.neutral;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <T variant="small" color={color} style={styles.pillText}>
        {es.direction[direction]}
      </T>
    </View>
  );
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  const { c } = useTheme();
  const { nameOf } = useAreas();
  const [menuFor, setMenuFor] = useState<TimelineItem | null>(null);
  const balance = dayBalance(items);
  const labeled = balance.toward + balance.away;

  const edit = (item: TimelineItem) => router.push({ pathname: '/timeline/[id]', params: { id: item.id } });
  const remove = async (item: TimelineItem) => {
    if (await confirm({})) deleteTimelineItem(item.id);
  };

  return (
    <View style={styles.section}>
      <SectionTitle>{es.today.timeline.title}</SectionTitle>
      {items.length === 0 ? (
        <Card>
          <T variant="muted">{es.today.timeline.empty}</T>
        </Card>
      ) : (
        <Card style={styles.list}>
          {items.map((item, i) => (
            <View
              key={item.id}
              style={[styles.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.time} ${item.activity}`}
                onPress={() => edit(item)}
                onLongPress={() => setMenuFor(item)}
                style={({ pressed }) => [styles.itemMain, { opacity: pressed ? 0.7 : 1 }]}
              >
                <T style={styles.time} color={c.muted}>
                  {item.time}
                </T>
                <View style={styles.itemBody}>
                  <T>{item.activity}</T>
                  {item.thought ? (
                    <T variant="small" style={styles.thought}>
                      “{item.thought}”
                    </T>
                  ) : null}
                  {item.direction || item.areaId ? (
                    <View style={styles.meta}>
                      {item.direction ? <DirectionPill direction={item.direction} /> : null}
                      {item.areaId ? <T variant="small">{nameOf(item.areaId)}</T> : null}
                    </View>
                  ) : null}
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={es.today.timeline.more}
                onPress={() => setMenuFor(item)}
                hitSlop={10}
                style={styles.dots}
              >
                <T variant="muted">⋯</T>
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <T style={styles.balanceTitle}>{es.today.timeline.balance}</T>
        {labeled === 0 ? (
          <T variant="small">{es.today.timeline.balanceEmpty}</T>
        ) : (
          <>
            <View style={[styles.bar, { backgroundColor: c.none }]}>
              {balance.toward > 0 ? <View style={{ flex: balance.toward, backgroundColor: c.toward }} /> : null}
              {balance.away > 0 ? <View style={{ flex: balance.away, backgroundColor: c.away }} /> : null}
            </View>
            <T variant="small">{es.today.timeline.balanceLabel(balance.toward, balance.away)}</T>
          </>
        )}
      </Card>

      <ActionMenu
        visible={menuFor !== null}
        title={menuFor?.activity}
        onClose={() => setMenuFor(null)}
        actions={
          menuFor
            ? [
                { label: es.common.edit, onPress: () => edit(menuFor) },
                { label: es.common.delete, destructive: true, onPress: () => void remove(menuFor) },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  list: { paddingVertical: spacing.xs, gap: 0 },
  item: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md },
  itemMain: { flex: 1, flexDirection: 'row', gap: spacing.md },
  time: { width: 48, fontVariant: ['tabular-nums'], fontWeight: '600' },
  itemBody: { flex: 1, gap: spacing.xs },
  thought: { fontStyle: 'italic' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pillText: { fontWeight: '600' },
  dots: { paddingHorizontal: spacing.xs, justifyContent: 'center' },
  balanceTitle: { fontWeight: '600' },
  bar: { height: 14, borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
});
