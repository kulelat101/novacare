'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrLinkPatientAccount } from '@/lib/patientAccounts';
import {
  loadPatientProfile,
  savePatientProfile,
} from '@/lib/patientFirestore';
import { usePatient } from './PatientProvider';

function generatePatientId() {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = String(now.getTime()).slice(-6);
  return `NC-${year}-${suffix}`;
}

const emptyForm = () => ({
  patientId: generatePatientId(),
  status: '',
  caseNo: '',
  dateAdmission: '',
  attending: '',
  insurance: '',
  roomNo: '',
  ward: '',
  chiefComplaint: '',
  admittingDx: '',
  primaryDiagnosis: '',
  modeAdmission: '',
  lastName: '',
  firstName: '',
  middleName: '',
  sex: '',
  age: '',
  civilStatus: '',
  dobBirthplace: '',
  religion: '',
  address: '',
  contactNo: '',
  emailAddress: '',
  emergName: '',
  emergNo: '',
  emergAddress: '',
  otherDx: '',
  allergies: '',
  allergyReaction: '',
  prevHosp: '',
  prevProc: '',
  currentMeds: '',
  gp: '',
  prevPreg: '',
  prevDeliv: '',
  pregComp: '',
  patientUid: '',
  patientUserId: '',
});

function normalizeForm(patient = null) {
  if (!patient) return emptyForm();

  return {
    ...emptyForm(),
    ...patient,
    patientId: patient.patientId || patient.id || '',
    emailAddress: patient.emailAddress || patient.email || '',
    patientUid: patient.patientUid || patient.patientUserId || '',
    patientUserId: patient.patientUserId || patient.patientUid || '',
  };
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="section-card p-5 lg:p-6">
      <h2 className="mb-5 text-lg font-semibold text-slate-900 lg:text-xl">{title}</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">{children}</div>
    </section>
  );
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${wide ? 'lg:col-span-2' : ''}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-line break-words text-sm font-semibold text-slate-800">
        {formatValue(value)}
      </p>
    </div>
  );
}

export function PatientAdmissionInfoView({ patient }) {
  if (!patient) {
    return (
      <section className="section-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Admission Information</h2>
        <p className="mt-2 text-sm text-slate-500">
          No patient chart is linked to this account yet.
        </p>
      </section>
    );
  }

  return (
    <section className="section-card p-5 lg:p-6">
      <div className="mb-5">
        <p className="section-kicker">View Only</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Admission Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Patient accounts can only view admission information. Editing is reserved for authorized staff.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <InfoItem label="Patient ID" value={patient.patientId || patient.id} />
        <InfoItem label="Status" value={patient.status} />
        <InfoItem label="Case No." value={patient.caseNo} />
        <InfoItem label="Date of Admission" value={patient.dateAdmission} />
        <InfoItem label="Attending Physician(s)" value={patient.attending} />
        <InfoItem label="Insurance" value={patient.insurance} />
        <InfoItem label="Room No." value={patient.roomNo} />
        <InfoItem label="Ward / Unit" value={patient.ward} />
        <InfoItem label="Primary / Admitting Diagnosis" value={patient.admittingDx || patient.primaryDiagnosis} wide />
        <InfoItem label="Chief Complaint" value={patient.chiefComplaint} />
        <InfoItem label="Mode of Admission" value={patient.modeAdmission} />
      </div>
    </section>
  );
}

export default function PatientRegistrationForm({
  patientIdToEdit = '',
  redirectAfterSave = true,
  compact = false,
  onSaved,
}) {
  const router = useRouter();
  const {
    createPatient,
    refreshPatients,
    refreshActivePatient,
    selectPatient,
  } = usePatient();
  const [form, setForm] = useState(() => emptyForm());
  const [loadedPatient, setLoadedPatient] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isEditMode = Boolean(patientIdToEdit);

  const fullName = useMemo(() => {
    return [form.firstName, form.middleName, form.lastName]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
  }, [form.firstName, form.middleName, form.lastName]);

  useEffect(() => {
    let mounted = true;

    async function loadEditablePatient() {
      setMessage('');
      setError('');

      if (!patientIdToEdit) {
        setLoadedPatient(null);
        setForm(emptyForm());
        return;
      }

      setIsLoadingPatient(true);

      try {
        const patient = await loadPatientProfile(patientIdToEdit);

        if (!mounted) return;

        if (!patient) {
          setError('Patient record not found.');
          setLoadedPatient(null);
          setForm(emptyForm());
          return;
        }

        setLoadedPatient(patient);
        setForm(normalizeForm(patient));
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Failed to load patient details.');
        }
      } finally {
        if (mounted) {
          setIsLoadingPatient(false);
        }
      }
    }

    loadEditablePatient();

    return () => {
      mounted = false;
    };
  }, [patientIdToEdit]);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function clearForm() {
    setForm(isEditMode ? normalizeForm(loadedPatient) : emptyForm());
    setMessage('');
    setError('');
  }

  async function savePatient() {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const patientId = String(form.patientId || form.caseNo || generatePatientId()).trim();
      const emailAddress = String(form.emailAddress || form.email || '').trim().toLowerCase();

      if (!patientId || !form.firstName || !form.lastName || !emailAddress) {
        setError('Please provide Patient ID, First Name, Family Name, and Email Address.');
        return;
      }

      const accountResult = (!form.patientUid && !form.patientUserId)
        ? await createOrLinkPatientAccount({
            patientId,
            email: emailAddress,
            fullName: fullName || `${form.firstName} ${form.lastName}`,
          })
        : null;

      const linkedUid = accountResult?.uid || form.patientUid || form.patientUserId || '';
      const payload = {
        ...form,
        patientId,
        id: patientId,
        email: emailAddress,
        emailAddress,
        fullName: fullName || `${form.firstName} ${form.lastName}`,
        primaryDiagnosis: form.primaryDiagnosis || form.admittingDx,
        patientUid: linkedUid,
        patientUserId: linkedUid,
        hasPatientPortalAccount: Boolean(linkedUid),
      };

      let savedPatient;

      if (isEditMode) {
        await savePatientProfile(patientId, payload, { merge: true });
        await refreshPatients();
        await refreshActivePatient(patientId);
        savedPatient = { ...payload, id: patientId };
        await selectPatient(savedPatient);
      } else {
        savedPatient = await createPatient(payload);
      }

      const accountMessage = accountResult?.created
        ? `\nPatient account created.\nUsername: ${accountResult.email}\nTemporary password: ${accountResult.temporaryPassword}`
        : accountResult?.linked
          ? `\nExisting patient account linked: ${accountResult.email}`
          : linkedUid
            ? '\nPatient account is already linked.'
            : '';

      setMessage(`${savedPatient.fullName || savedPatient.patientId} ${isEditMode ? 'updated' : 'registered and selected'}.${accountMessage}`);
      setLoadedPatient(savedPatient);
      onSaved?.(savedPatient);

      if (redirectAfterSave && !isEditMode) {
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to save patient. Please check your Firestore connection.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-36">
      {(message || error) && (
        <div
          className={`whitespace-pre-line rounded-2xl border px-5 py-4 text-sm font-medium ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || message}
        </div>
      )}

      {isLoadingPatient && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600">
          Loading patient details...
        </div>
      )}

      <Section title="Admission Information">
        <Field label="Patient ID" required>
          <input className="input" value={form.patientId} onChange={(event) => updateField('patientId', event.target.value)} disabled={isEditMode} />
        </Field>

        <Field label="Status" required>
          <select className="input" value={form.status} onChange={(event) => updateField('status', event.target.value)} >
            <option value=""></option>
            <option value="Admitted">Admitted</option>
            <option value="Outpatient">Outpatient</option>
            <option value="Discharged">Discharged</option>
            <option value="For Observation">For Observation</option>
          </select>
        </Field>

        <Field label="Case No.">
          <input className="input" value={form.caseNo} onChange={(event) => updateField('caseNo', event.target.value)} />
        </Field>

        <Field label="Date of Admission" required>
          <input type="datetime-local" className="input" value={form.dateAdmission} onChange={(event) => updateField('dateAdmission', event.target.value)} />
        </Field>

        <Field label="Attending Physician(s)">
          <input className="input" value={form.attending} onChange={(event) => updateField('attending', event.target.value)} />
        </Field>

        <Field label="Insurance">
          <input className="input" value={form.insurance} onChange={(event) => updateField('insurance', event.target.value)} />
        </Field>

        <Field label="Room No.">
          <input className="input" value={form.roomNo} onChange={(event) => updateField('roomNo', event.target.value)} />
        </Field>

        <Field label="Ward / Unit">
          <input className="input" value={form.ward} onChange={(event) => updateField('ward', event.target.value)} />
        </Field>

        <div className="lg:col-span-2">
          <Field label="Primary / Admitting Diagnosis" required>
            <textarea rows={3} className="input" value={form.admittingDx} onChange={(event) => updateField('admittingDx', event.target.value)} />
          </Field>
        </div>

        {!compact && (
          <>
            <Field label="Chief Complaint">
              <input className="input" value={form.chiefComplaint} onChange={(event) => updateField('chiefComplaint', event.target.value)} />
            </Field>

            <Field label="Mode of Admission">
              <select className="input" value={form.modeAdmission} onChange={(event) => updateField('modeAdmission', event.target.value)}>
                <option value=""></option>
                <option value="Elective">Elective</option>
                <option value="Emergency">Emergency</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Transfer">Transfer</option>
              </select>
            </Field>
          </>
        )}
      </Section>

      <Section title="Demographics">
        <Field label="Family Name" required>
          <input className="input" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} />
        </Field>

        <Field label="First Name" required>
          <input className="input" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} />
        </Field>

        <Field label="Middle Name">
          <input className="input" value={form.middleName} onChange={(event) => updateField('middleName', event.target.value)} />
        </Field>

        <Field label="Email Address" required>
          <input type="email" className="input" value={form.emailAddress || ''} onChange={(event) => updateField('emailAddress', event.target.value)} />
        </Field>

        <Field label="Sex">
          <select className="input" value={form.sex} onChange={(event) => updateField('sex', event.target.value)}>
            <option value=""></option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>

        <Field label="Age">
          <input type="number" className="input" value={form.age} onChange={(event) => updateField('age', event.target.value)} />
        </Field>

        <Field label="Civil Status">
          <select className="input" value={form.civilStatus} onChange={(event) => updateField('civilStatus', event.target.value)}>
            <option value=""></option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </Field>

        {!compact && (
          <>
            <Field label="Date of Birth / Birth Place">
              <input className="input" value={form.dobBirthplace} onChange={(event) => updateField('dobBirthplace', event.target.value)} />
            </Field>

            <Field label="Religion">
              <input className="input" value={form.religion} onChange={(event) => updateField('religion', event.target.value)} />
            </Field>
          </>
        )}

        <div className="lg:col-span-2">
          <Field label="Address">
            <input className="input" value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          </Field>
        </div>

        <Field label="Contact No.">
          <input className="input" value={form.contactNo} onChange={(event) => updateField('contactNo', event.target.value)} />
        </Field>
      </Section>

      {!compact && (
        <>
          <Section title="Emergency Contact">
            <Field label="Emergency Contact Name">
              <input className="input" value={form.emergName} onChange={(event) => updateField('emergName', event.target.value)} />
            </Field>

            <Field label="Emergency Contact No.">
              <input className="input" value={form.emergNo} onChange={(event) => updateField('emergNo', event.target.value)} />
            </Field>

            <div className="lg:col-span-2">
              <Field label="Emergency Contact Address">
                <input className="input" value={form.emergAddress} onChange={(event) => updateField('emergAddress', event.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Medical History">
            <Field label="Other Diagnosis">
              <input className="input" value={form.otherDx} onChange={(event) => updateField('otherDx', event.target.value)} />
            </Field>

            <Field label="Allergies">
              <input className="input" value={form.allergies} onChange={(event) => updateField('allergies', event.target.value)} />
            </Field>

            <Field label="Reaction to Allergies">
              <input className="input" value={form.allergyReaction} onChange={(event) => updateField('allergyReaction', event.target.value)} />
            </Field>

            <Field label="Previous Hospitalizations">
              <input className="input" value={form.prevHosp} onChange={(event) => updateField('prevHosp', event.target.value)} />
            </Field>

            <Field label="Previous Procedures">
              <input className="input" value={form.prevProc} onChange={(event) => updateField('prevProc', event.target.value)} />
            </Field>

            <div className="lg:col-span-2">
              <Field label="Current Medications">
                <textarea rows={3} className="input" value={form.currentMeds} onChange={(event) => updateField('currentMeds', event.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Obstetric History">
            <Field label="Gravida / Para">
              <input className="input" value={form.gp} onChange={(event) => updateField('gp', event.target.value)} />
            </Field>

            <Field label="Previous Pregnancies">
              <input className="input" value={form.prevPreg} onChange={(event) => updateField('prevPreg', event.target.value)} />
            </Field>

            <Field label="Previous Deliveries">
              <input className="input" value={form.prevDeliv} onChange={(event) => updateField('prevDeliv', event.target.value)} />
            </Field>

            <Field label="Pregnancy Complications">
              <input className="input" value={form.pregComp} onChange={(event) => updateField('pregComp', event.target.value)} />
            </Field>
          </Section>
        </>
      )}

      <div className="fixed bottom-6 left-4 right-4 z-50 lg:left-72 lg:right-0">
        <div className="content-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={clearForm}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditMode ? 'Reset' : 'Clear'}
            </button>

            <button
              type="button"
              onClick={savePatient}
              disabled={isSaving || isLoadingPatient}
              className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update Patient Details' : 'Save & Select Patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
