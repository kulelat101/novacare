'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createOrLinkPatientAccount,
  sendPatientPasswordResetEmail,
} from '@/lib/patientAccounts';
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
  const [createdAccount, setCreatedAccount] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isEditMode = Boolean(patientIdToEdit);

  const patientAccountEmail = String(form.emailAddress || form.email || '').trim().toLowerCase();
  const hasLinkedPatientAccount = Boolean(
    form.patientUid
      || form.patientUserId
      || loadedPatient?.patientUid
      || loadedPatient?.patientUserId
      || loadedPatient?.hasPatientPortalAccount
  );

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
      setCreatedAccount(null);
      setIsCopied(false);
      setIsSendingReset(false);

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
    setCreatedAccount(null);
    setIsCopied(false);
    setIsSendingReset(false);
  }

  async function copyTextToClipboard(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  async function copyPatientCredentials() {
    if (!createdAccount) return;

    const credentialsText = [
      'Nova Care Hospital Patient Portal',
      `Patient: ${createdAccount.fullName || ''}`,
      `Username: ${createdAccount.email}`,
      `Temporary password: ${createdAccount.temporaryPassword}`,
      'Please change your password after logging in.',
    ].filter(Boolean).join('\n');

    try {
      await copyTextToClipboard(credentialsText);
      setIsCopied(true);
    } catch (err) {
      console.error(err);
      setError('Could not copy the patient credentials. You can manually copy them from the panel.');
    }
  }

  async function copyPatientPortalUsername() {
    if (!patientAccountEmail) {
      setError('Please add the patient email address first.');
      return;
    }

    const usernameText = [
      'Nova Care Hospital Patient Portal',
      `Patient: ${fullName || form.patientId || ''}`,
      `Username: ${patientAccountEmail}`,
      'For password access, use Send Password Reset Email from the Patient Portal Account panel.',
    ].filter(Boolean).join('\n');

    try {
      await copyTextToClipboard(usernameText);
      setError('');
      setMessage(`Patient portal username copied for ${patientAccountEmail}.`);
    } catch (err) {
      console.error(err);
      setError('Could not copy the patient portal username. You can manually copy the email address.');
    }
  }

  async function sendPatientPasswordReset() {
    if (!patientAccountEmail) {
      setError('Please add the patient email address first.');
      return;
    }

    setIsSendingReset(true);
    setError('');
    setMessage('');

    try {
      const email = await sendPatientPasswordResetEmail(patientAccountEmail);
      setMessage(`Password reset email sent to ${email}. The patient can use the email link to set a new password.`);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Could not send the password reset email. Please check if the email exists in Firebase Authentication.');
    } finally {
      setIsSendingReset(false);
    }
  }

  function closeAccountPanel() {
    setCreatedAccount(null);
    setIsCopied(false);
  }

  function continueToDashboard() {
    setCreatedAccount(null);
    setIsCopied(false);
    router.replace('/dashboard');
  }

  async function savePatient() {
    setIsSaving(true);
    setMessage('');
    setError('');
    setCreatedAccount(null);
    setIsCopied(false);
    setIsSendingReset(false);

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

      if (accountResult?.created) {
        setCreatedAccount({
          email: accountResult.email,
          temporaryPassword: accountResult.temporaryPassword,
          fullName: savedPatient.fullName || fullName || savedPatient.patientId,
          patientId,
        });
      }

      const accountMessage = accountResult?.created
        ? '\nPatient account created. Copy the temporary credentials before leaving this page.'
        : accountResult?.linked
          ? `\nExisting patient account linked: ${accountResult.email}`
          : linkedUid
            ? '\nPatient account is already linked.'
            : '';

      setMessage(`${savedPatient.fullName || savedPatient.patientId} ${isEditMode ? 'updated' : 'registered and selected'}.${accountMessage}`);
      setLoadedPatient(savedPatient);
      onSaved?.(savedPatient);

      if (redirectAfterSave && !isEditMode && !accountResult?.created) {
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

      {createdAccount && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <p className="section-kicker text-emerald-600">Patient Account Created</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Copy the temporary credentials</h2>
              <p className="mt-2 text-sm text-slate-500">
                This temporary password is shown only now. It is not saved in Firestore and cannot be viewed again later.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Patient</p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {createdAccount.fullName || createdAccount.patientId}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Username / Email</p>
                <p className="mt-1 break-all rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-semibold text-slate-900">
                  {createdAccount.email}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Temporary Password</p>
                <p className="mt-1 break-all rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-semibold text-slate-900">
                  {createdAccount.temporaryPassword}
                </p>
              </div>
            </div>

            {isCopied && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Credentials copied. Give these to the patient and ask them to change the password after logging in.
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={copyPatientCredentials}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700"
              >
                {isCopied ? 'Copied' : 'Copy Credentials'}
              </button>

              <button
                type="button"
                onClick={closeAccountPanel}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium transition hover:bg-slate-50"
              >
                Stay on Page
              </button>

              {redirectAfterSave && !isEditMode && (
                <button
                  type="button"
                  onClick={continueToDashboard}
                  className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-700"
                >
                  Continue to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoadingPatient && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600">
          Loading patient details...
        </div>
      )}

      {isEditMode && (
        <section className="section-card p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-kicker">Patient Portal Account</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 lg:text-xl">Login access</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Temporary passwords are shown only when a new patient account is created. For an existing account, send a password reset email instead.
              </p>
            </div>

            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
              hasLinkedPatientAccount
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}>
              {hasLinkedPatientAccount ? 'Linked' : 'Not linked yet'}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Username / Email</p>
              <p className="mt-1 break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-sm font-semibold text-slate-900">
                {patientAccountEmail || '—'}
              </p>
              {!hasLinkedPatientAccount && (
                <p className="mt-2 text-xs text-slate-500">
                  Save this patient record with an email address to create or link the patient portal account.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <button
                type="button"
                onClick={copyPatientPortalUsername}
                disabled={!patientAccountEmail || isSaving || isLoadingPatient}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Copy Username
              </button>

              <button
                type="button"
                onClick={sendPatientPasswordReset}
                disabled={!patientAccountEmail || !hasLinkedPatientAccount || isSendingReset || isSaving || isLoadingPatient}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingReset ? 'Sending...' : 'Send Password Reset Email'}
              </button>
            </div>
          </div>
        </section>
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
