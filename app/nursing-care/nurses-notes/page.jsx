'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'dateTime', label: 'Date/Time', type: 'datetime-local', required: true },
  { name: 'focus', label: 'Focus / Concern', required: true },
  { name: 'data', label: 'Data', type: 'textarea', required: true },
  { name: 'action', label: 'Action', type: 'textarea', required: true },
  { name: 'response', label: 'Response', type: 'textarea', required: true },
];

export default function NursesNotesPage() {
  return (
    <AppShell title="Nurse's Notes" subtitle="Restricted nursing documentation">
      <PageIntro title="FDAR Nurse's Notes" description="This module is accessible to nurse users only in the demo RBAC setup." />
      <RecordForm collectionName="nursesNotes" fields={fields} />
    </AppShell>
  );
}
