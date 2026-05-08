'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';

const fields = [
  { name: 'firstName', label: 'First Name', required: true },
  { name: 'lastName', label: 'Last Name', required: true },
  { name: 'birthDate', label: 'Birth Date', type: 'date', required: true },
  { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], required: true },
  { name: 'address', label: 'Address', required: true },
  { name: 'contactNumber', label: 'Contact Number', required: true },
  { name: 'emergencyContact', label: 'Emergency Contact', required: true },
  { name: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea', required: true },
];

export default function RegistrationPage() {
  return (
    <AppShell title="Patient Registration" subtitle="Admission and patient profile">
      <PageIntro title="Registration Form" description="Capture basic patient admission information for the HIS demo." showPatient={false} />
      <RecordForm collectionName="patients" fields={fields} />
    </AppShell>
  );
}
