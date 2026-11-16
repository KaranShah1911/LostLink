import { Tabs } from 'expo-router/js-tabs';
import { BrandTitle, ReportTabIcon, tabIcon, tabScreenOptions } from '@/components/tabBar';

/**
 * Student interface: Home, Browse, Report, My Activity.
 * Profile is not a tab; it opens from the avatar at the top-right of every screen.
 * The root layout only mounts this group for users whose role is STUDENT.
 */
export default function StudentTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', headerTitle: () => <BrandTitle />, tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen name="browse" options={{ title: 'Browse', headerTitle: 'Browse Items', tabBarIcon: tabIcon('search-outline', 'search') }} />
      <Tabs.Screen name="report" options={{ title: 'Report', headerTitle: 'Report an Item', tabBarIcon: () => <ReportTabIcon /> }} />
      <Tabs.Screen name="activity" options={{ title: 'My Activity', tabBarIcon: tabIcon('layers-outline', 'layers') }} />
    </Tabs>
  );
}
