'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import PatientRegistrationForm, { PatientAdmissionInfoView } from '@/components/PatientRegistrationForm';
import { useAuth } from '@/components/AuthProvider';
import { usePatient } from '@/components/PatientProvider';
import { ROLES } from '@/lib/roles';

export default function RegistrationPage() {
  const { profile } = useAuth();
  const { activePatient, activePatientId } = usePatient();
  const [patientIdToEdit, setPatientIdToEdit] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    setPatientIdToEdit(params.get('patientId') || '');
  }, []);

  const isPatientView = profile?.role === ROLES.PATIENT;

  if (isPatientView) {
    return (
      <AppShell
        title="Patient Registration"
        subtitle="Admission information and editable patient details"
      >
        <div className="space-y-6">
          <PageIntro
            title="Patient Registration"
            description="Admission information is view-only. You can update your demographics and emergency contact details."
          />

          <PatientAdmissionInfoView patient={activePatient} />

          {activePatientId ? (
            <PatientRegistrationForm
              patientIdToEdit={activePatientId}
              redirectAfterSave={false}
              patientSelfEdit
            />
          ) : (
            <section className="section-card p-6">
              <h2 className="text-lg font-semibold text-slate-900">No linked patient chart</h2>
              <p className="mt-2 text-sm text-slate-500">
                Please contact hospital staff to link your portal account to your patient chart.
              </p>
            </section>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Patient Registration"
      subtitle={patientIdToEdit ? 'Edit patient chart details' : 'Create a patient chart and make it the active patient'}
    >
      <div className="space-y-6">
        <PageIntro
          title={patientIdToEdit ? 'Edit Patient Details' : 'Registration Form'}
          description={
            patientIdToEdit
              ? 'Update the selected patient chart. Patient ID is locked to avoid accidentally creating a different chart.'
              : 'Register a patient chart. Once saved, the patient becomes the active chart used by all clinical modules. A patient portal account is created using the email address.'
          }
          showPatient={false}
        />

        <div className="section-card p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-kicker">Patient Details</p>
              <p className="mt-1 text-sm text-slate-600">
                {patientIdToEdit
                  ? `Editing patient: ${patientIdToEdit}`
                  : activePatientId
                    ? `Active patient: ${activePatientId}`
                    : 'No active patient selected.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {activePatientId && !patientIdToEdit && (
                <Link href={`/admission/registration?patientId=${encodeURIComponent(activePatientId)}`} className="btn-secondary">
                  Edit Active Patient
                </Link>
              )}

              {patientIdToEdit && (
                <Link href="/admission/registration" className="btn-primary">
                  + New Patient
                </Link>
              )}
            </div>
          </div>
        </div>

        <PatientRegistrationForm patientIdToEdit={patientIdToEdit} />
      </div>
    </AppShell>
  );
}
