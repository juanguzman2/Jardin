import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { es } from '../../copy/es';
import { getDay, listCommitments } from '../../db/days';
import { useDbQuery } from '../../db/live';
import { listTimeline } from '../../db/timeline';
import { listValues } from '../../db/values';
import { DayNav } from '../../ui/DayNav';
import { Fab } from '../../ui/Fab';
import { Screen } from '../../ui/Screen';
import { BackupBanner } from '../common/BackupBanner';
import { useUi } from '../common/uiStore';
import { useToday } from '../common/useToday';
import { ClosingCard } from './ClosingCard';
import { OpeningCard } from './OpeningCard';
import { Timeline } from './Timeline';

export function TodayScreen() {
  const today = useToday();
  const selected = useUi((s) => s.todayTabDay);
  const day = selected && selected < today ? selected : today;
  const isToday = day === today;
  const setDay = (d: string) => useUi.setState({ todayTabDay: d >= today ? null : d });

  const entry = useDbQuery(() => getDay(day), [day]);
  const commitments = useDbQuery(() => listCommitments(day), [day]);
  const items = useDbQuery(() => listTimeline(day), [day]);
  const values = useDbQuery(() => listValues());

  return (
    <View style={styles.flex}>
      <Screen>
        <DayNav day={day} today={today} onChange={setDay} />
        <BackupBanner today={today} />
        <OpeningCard day={day} isToday={isToday} entry={entry} values={values} commitments={commitments} />
        <Timeline items={items} />
        <ClosingCard day={day} isToday={isToday} entry={entry} commitments={commitments} />
      </Screen>
      <Fab
        accessibilityLabel={es.today.fab.open}
        options={[
          {
            label: es.today.fab.timeline,
            onPress: () => router.push({ pathname: '/timeline/[id]', params: { id: 'new', date: day } }),
          },
          {
            label: es.today.fab.record,
            onPress: () => router.push({ pathname: '/record/[id]', params: { id: 'new', date: day } }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
