'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'ivFluid', label: 'IV Fluid', required: true },
  { name: 'bottleNumber', label: 'Bottle Number', required: true },
  { name: 'rate', label: 'Flow Rate', required: true },
  { name: 'siteCondition', label: 'IV Site Condition', required: true },
  { name: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function IvSheetPage() {
  return (
    <AppShell title="IV Sheet" subtitle="Intravenous therapy monitoring">
      <PageIntro title="IV Therapy Record" description="Document IV fluid, rate, site condition, and related observations." />
      <RecordForm collectionName="ivSheets" fields={fields} />
    </AppShell>
  );
}
