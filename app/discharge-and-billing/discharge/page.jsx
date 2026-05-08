'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dischargeDate', label: 'Discharge Date', type: 'date', required: true },
  { name: 'finalDiagnosis', label: 'Final Diagnosis', required: true },
  { name: 'conditionOnDischarge', label: 'Condition on Discharge', type: 'select', options: ['Improved', 'Recovered', 'Transferred', 'Against Medical Advice'], required: true },
  { name: 'homeMedications', label: 'Home Medications', type: 'textarea' },
  { name: 'dischargeInstructions', label: 'Discharge Instructions', type: 'textarea', required: true },
  { name: 'followUpSchedule', label: 'Follow-up Schedule', required: true },
];

export default function DischargePage() {
  return (
    <AppShell title="Discharge" subtitle="Discharge planning and instructions">
      <PageIntro title="Discharge Summary" description="Prepare final diagnosis, instructions, medications, and follow-up schedule." />
      <RecordForm collectionName="dischargeRecords" fields={fields} />
    </AppShell>
  );
}
