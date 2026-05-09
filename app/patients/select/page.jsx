'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import {
  formatPatientName,
  getPatientDiagnosis,
  getPatientRoomWard,
  usePatient,
} from '@/components/PatientProvider';

const DEMO_PATIENT = {
  patientId: 'NC-2026-001',
  id: 'NC-2026-001',
  firstName: 'Juan',
  middleName: '',
  lastName: 'Dela Cruz',
  fullName: 'Juan Dela Cruz',
  sex: 'Male',
  age: '32',
  status: 'Admitted',
  roomNo: 'Room 210',
  ward: 'Medical Ward',
  primaryDiagnosis: 'Acute Gastroenteritis',
  admittingDx: 'Acute Gastroenteritis',
  dateAdmission: '2026-05-08T08:00',
};

export default function PatientSelectPage() {
  const router = useRouter();
  const {
    activePatientId,
    patients,
    loadingPatients,
    patientError,
    refreshPatients,
    selectPatient,
    createPatient,
  } = usePatient();
  const [query, setQuery] = useState('');
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  const filteredPatients = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return patients;

    return patients.filter((patient) => {
      const haystack = [
        patient.patientId,
        patient.id,
        formatPatientName(patient),
        getPatientRoomWard(patient),
        getPatientDiagnosis(patient),
        patient.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [patients, query]);

  async function handleSelectPatient(patient) {
    await selectPatient(patient);
    router.replace('/dashboard');
  }

  async function handleUseDemoPatient() {
    setIsCreatingDemo(true);

    try {
      const existing = patients.find(
        (patient) => patient.patientId === DEMO_PATIENT.patientId || patient.id === DEMO_PATIENT.patientId
      );

      if (existing) {
        await handleSelectPatient(existing);
        return;
      }

      await createPatient(DEMO_PATIENT);
      router.replace('/dashboard');
    } finally {
      setIsCreatingDemo(false);
    }
  }

  return (
    <AppShell title="Select Patient" subtitle="Choose the active patient chart">
      <div className="space-y-6">
        <PageIntro
          title="Patient Selection"
          description="Select an existing patient or register a new patient before opening clinical modules. All saved records will be tied to the selected patient."
          showPatient={false}
        />

        <section className="section-card p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="label">Search Patient</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by patient name, ID, room, diagnosis..."
                className="input"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={refreshPatients} className="btn-secondary">
                Refresh
              </button>

              <button
                type="button"
                onClick={handleUseDemoPatient}
                disabled={isCreatingDemo}
                className="btn-secondary"
              >
                {isCreatingDemo ? 'Preparing...' : 'Use Demo Patient'}
              </button>

              <Link href="/admission/registration" className="btn-primary text-center">
                + Register Patient
              </Link>
            </div>
          </div>
        </section>

        {patientError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {patientError}
          </div>
        )}

        <section className="section-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="section-kicker">Patient Registry</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Registered Patients</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current active patient: {activePatientId || 'None selected'}
            </p>
          </div>

          {loadingPatients ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No patients found. Register a patient or use the patient.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const patientId = patient.patientId || patient.id;
                const active = patientId === activePatientId;

                return (
                  <div key={patientId} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.2fr,1fr,1fr,auto] lg:items-center">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{formatPatientName(patient)}</p>
                      <p className="mt-1 text-sm text-slate-500">Patient ID: {patientId}</p>
                    </div>

                    <div>
                      <p className="section-kicker">Room / Ward</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{getPatientRoomWard(patient)}</p>
                    </div>

                    <div>
                      <p className="section-kicker">Diagnosis</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{getPatientDiagnosis(patient)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className={active ? 'btn-secondary' : 'btn-primary'}
                    >
                      {active ? 'Selected' : 'Select Patient'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
