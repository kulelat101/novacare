'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'testName', label: 'Laboratory Test', required: true },
  { name: 'result', label: 'Result', required: true },
  { name: 'referenceRange', label: 'Reference Range' },
  { name: 'interpretation', label: 'Interpretation', type: 'select', options: ['Normal', 'High', 'Low', 'Critical', 'Pending'], required: true },
  { name: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function LaboratoryPage() {
  return (
    <AppShell title="Laboratory" subtitle="Diagnostic results">
      <PageIntro title="Laboratory Result Entry" description="Record demo laboratory test results and interpretation." />
      <RecordForm collectionName="laboratoryResults" fields={fields} />
    </AppShell>
  );
}
