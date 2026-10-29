import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { es } from '../../src/copy/es';
import { IconButton } from '../../src/ui/Button';
import { GearIcon, LoopIcon, NotebookIcon, SproutIcon, SunIcon } from '../../src/ui/icons';
import { useTheme } from '../../src/ui/theme';

function SettingsButton() {
  const { c } = useTheme();
  return (
    <IconButton accessibilityLabel={es.settings.title} onPress={() => router.push('/settings')}>
      <GearIcon color={c.text} />
    </IconButton>
  );
}

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerRight: () => <SettingsButton />,
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarLabelStyle: { fontSize: 13 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: es.tabs.today, headerTitle: es.appName, tabBarIcon: ({ color }) => <SunIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="habits"
        options={{ title: es.tabs.habits, tabBarIcon: ({ color }) => <SproutIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: es.tabs.records, tabBarIcon: ({ color }) => <NotebookIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="patterns"
        options={{ title: es.tabs.patterns, tabBarIcon: ({ color }) => <LoopIcon color={String(color)} /> }}
      />
    </Tabs>
  );
}
