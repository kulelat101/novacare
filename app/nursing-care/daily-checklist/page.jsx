'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'hygieneCare', label: 'Hygiene Care', type: 'select', options: ['Done', 'Not Done', 'Not Applicable'], required: true },
  { name: 'oralCare', label: 'Oral Care', type: 'select', options: ['Done', 'Not Done', 'Not Applicable'], required: true },
  { name: 'bedPosition', label: 'Bed Position / Safety', required: true },
  { name: 'turningSchedule', label: 'Turning / Repositioning', required: true },
  { name: 'dietTolerance', label: 'Diet Tolerance', required: true },
  { name: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function DailyChecklistPage() {
  return (
    <AppShell title="Daily Checklist" subtitle="Routine nursing care checklist">
      <PageIntro title="Daily Care Checklist" description="Track routine nursing care tasks and remarks." />
      <RecordForm collectionName="dailyChecklists" fields={fields} />
    </AppShell>
  );
}
