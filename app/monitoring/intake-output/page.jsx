'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'oralIntake', label: 'Oral Intake mL', type: 'number', required: true },
  { name: 'ivIntake', label: 'IV Intake mL', type: 'number', required: true },
  { name: 'urineOutput', label: 'Urine Output mL', type: 'number', required: true },
  { name: 'stoolOutput', label: 'Stool / Other Output mL', type: 'number' },
  { name: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function IntakeOutputPage() {
  return (
    <AppShell title="Intake & Output" subtitle="Fluid balance monitoring">
      <PageIntro title="I&O Sheet" description="Track patient intake and output totals for the shift." />
      <RecordForm collectionName="intakeOutput" fields={fields} />
    </AppShell>
  );
}
