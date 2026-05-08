'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time Given', type: 'datetime-local', required: true },
  { name: 'medication', label: 'Medication', required: true },
  { name: 'dosage', label: 'Dosage', required: true },
  { name: 'route', label: 'Route', type: 'select', options: ['PO', 'IV', 'IM', 'SC', 'Topical', 'Inhalation'], required: true },
  { name: 'frequency', label: 'Frequency', required: true },
  { name: 'remarks', label: 'Remarks / Nurse Initials', type: 'textarea' },
];

export default function MedicationRecordPage() {
  return (
    <AppShell title="Medication Record" subtitle="MAR documentation">
      <PageIntro title="Medication Administration Record" description="Document medication, dosage, route, frequency, and administration remarks." />
      <RecordForm collectionName="medicationRecords" fields={fields} />
    </AppShell>
  );
}
