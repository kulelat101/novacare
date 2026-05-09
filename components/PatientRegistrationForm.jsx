'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalDateTime } from '@/lib/patientFirestore';
import { usePatient } from './PatientProvider';

function generatePatientId() {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = String(now.getTime()).slice(-6);
  return ``;
}

const initialForm = () => ({
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
});

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

export default function PatientRegistrationForm({ redirectAfterSave = true, compact = false, onSaved }) {
  const router = useRouter();
  const { createPatient } = usePatient();
  const [form, setForm] = useState(() => initialForm());
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fullName = useMemo(() => {
    return [form.firstName, form.middleName, form.lastName]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
  }, [form.firstName, form.middleName, form.lastName]);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function clearForm() {
    setForm(initialForm());
    setMessage('');
    setError('');
  }

  async function savePatient() {
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const patientId = String(form.patientId || form.caseNo || generatePatientId()).trim();

      if (!patientId || !form.firstName || !form.lastName) {
        setError('Please provide Patient ID, First Name, and Family Name.');
        return;
      }

      const savedPatient = await createPatient({
        ...form,
        patientId,
        id: patientId,
        fullName: fullName || `${form.firstName} ${form.lastName}`,
        primaryDiagnosis: form.primaryDiagnosis || form.admittingDx,
      });

      setMessage(`${savedPatient.fullName || savedPatient.patientId} registered and selected.`);
      onSaved?.(savedPatient);

      if (redirectAfterSave) {
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to register patient. Please check your Firestore connection.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-36">
      {(message || error) && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || message}
        </div>
      )}

      <Section title="Admission Information">
        <Field label="Patient ID" required>
          <input className="input" value={form.patientId} onChange={(event) => updateField('patientId', event.target.value)} />
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
              Clear
            </button>

            <button
              type="button"
              onClick={savePatient}
              disabled={isSaving}
              className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save & Select Patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
