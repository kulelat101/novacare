'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'temperature', label: 'Temperature °C', type: 'number', required: true },
  { name: 'bloodPressure', label: 'Blood Pressure', required: true },
  { name: 'pulse', label: 'Pulse Rate', type: 'number', required: true },
  { name: 'respiratoryRate', label: 'Respiratory Rate', type: 'number', required: true },
  { name: 'oxygenSaturation', label: 'Oxygen Saturation %', type: 'number', required: true },
];

export default function VitalSignsPage() {
  return (
    <AppShell title="Vital Signs" subtitle="Monitoring module">
      <PageIntro title="Vital Signs Record" description="Record temperature, blood pressure, pulse, respirations, and oxygen saturation." />
      <RecordForm collectionName="vitalSigns" fields={fields} />
    </AppShell>
  );
}
