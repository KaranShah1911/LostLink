import { Tabs } from 'expo-router/js-tabs';
import { useTheme } from '@/context/ThemeContext';
import { BrandTitle, tabIcon, tabScreenOptions } from '@/components/tabBar';

/**
 * Administrator interface: Dashboard, All Reports, Claims. No student tabs.
 * The root layout only mounts this group for users whose role is ADMIN,
 * and the backend checks the role again on every /api/admin request.
 */
export default function AdminTabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={tabScreenOptions(colors, false)}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: () => <BrandTitle subtitle="ADMIN" />,
          tabBarIcon: tabIcon('speedometer-outline', 'speedometer'),
        }}
      />
      <Tabs.Screen name="all-reports" options={{ title: 'All Reports', tabBarIcon: tabIcon('albums-outline', 'albums') }} />
      <Tabs.Screen name="claims" options={{ title: 'Claims', tabBarIcon: tabIcon('hand-left-outline', 'hand-left') }} />
    </Tabs>
  );
}
