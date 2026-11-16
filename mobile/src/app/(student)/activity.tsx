import { useState } from 'react';
import { View } from 'react-native';
import ClaimsReceivedList from '@/components/activity/ClaimsReceivedList';
import MyClaimsList from '@/components/activity/MyClaimsList';
import MyReportsList from '@/components/activity/MyReportsList';
import Segmented from '@/components/Segmented';

type Section = 'reports' | 'claims' | 'received';
const SECTIONS = [
  { value: 'reports', label: 'My Reports' },
  { value: 'claims', label: 'My Claims' },
  { value: 'received', label: 'Claims Received' },
] as const;

/** My Activity tab: switches between My Reports, My Claims and Claims Received. */
export default function ActivityScreen() {
  const [section, setSection] = useState<Section>('reports');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Segmented options={SECTIONS} value={section} onChange={setSection} />
      </View>
      {section === 'reports' && <MyReportsList />}
      {section === 'claims' && <MyClaimsList />}
      {section === 'received' && <ClaimsReceivedList />}
    </View>
  );
}
