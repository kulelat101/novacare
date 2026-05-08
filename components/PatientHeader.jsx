'use client';

import Link from 'next/link';
import {
  IdentificationIcon,
  HomeModernIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  formatPatientName,
  getPatientDiagnosis,
  getPatientRoomWard,
  usePatient,
} from './PatientProvider';

export default function PatientHeader() {
  const { activePatient, activePatientId } = usePatient();

  const patientMeta = activePatientId
    ? [
        {
          label: 'Active Patient',
          value: activePatient ? formatPatientName(activePatient) : activePatientId,
          icon: UserIcon,
        },
        {
          label: 'Patient ID',
          value: activePatient?.patientId || activePatientId,
          icon: IdentificationIcon,
        },
        {
          label: 'Room / Ward',
          value: getPatientRoomWard(activePatient),
          icon: HomeModernIcon,
        },
        {
          label: 'Primary Diagnosis',
          value: getPatientDiagnosis(activePatient),
          icon: ClipboardDocumentCheckIcon,
        },
      ]
    : [];

  if (!activePatientId) {
    return (
      <section className="card mb-6 p-5 lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-kicker">Patient context</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">No patient selected</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select or register a patient before saving clinical records.
            </p>
          </div>
          <Link href="/patients/select" className="btn-primary text-center">
            Select Patient
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card mb-6 p-5 lg:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {patientMeta.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50">
                <Icon className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{value || '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
