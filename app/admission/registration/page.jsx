'use client';

import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import PatientRegistrationForm from '@/components/PatientRegistrationForm';

export default function RegistrationPage() {
  return (
    <AppShell
      title="Patient Registration"
      subtitle="Create a patient chart and make it the active patient"
    >
      <div className="space-y-6">
        <PageIntro
          title="Registration Form"
          description="Register a patient chart. Once saved, the patient becomes the active chart used by all clinical modules."
          showPatient={false}
        />

        <PatientRegistrationForm />
      </div>
    </AppShell>
  );
}
