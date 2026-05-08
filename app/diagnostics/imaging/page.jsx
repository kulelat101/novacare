'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'imagingType', label: 'Imaging Type', type: 'select', options: ['X-ray', 'Ultrasound', 'CT Scan', 'MRI', 'Other'], required: true },
  { name: 'bodyPart', label: 'Body Part / Area', required: true },
  { name: 'findings', label: 'Findings', type: 'textarea', required: true },
  { name: 'impression', label: 'Impression', type: 'textarea', required: true },
];

export default function ImagingPage() {
  return (
    <AppShell title="Imaging" subtitle="Diagnostic imaging reports">
      <PageIntro title="Imaging Report Entry" description="Record text-based imaging results for the demo system." />
      <RecordForm collectionName="imagingResults" fields={fields} />
    </AppShell>
  );
}
