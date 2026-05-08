'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import RecordForm from '@/components/RecordForm';
import { loadPatientRows } from '@/lib/patientFirestore';

const BILLING_COLLECTION_NAME = 'billingItems';

const fields = [
  // Discharge Information
  {
    section: 'Discharge Information',
    name: 'dateTimeOfDischarge',
    label: 'Date/Time of Discharge',
    type: 'datetime-local',
    required: true,
  },
  {
    section: 'Discharge Information',
    name: 'conditionOnDischarge',
    label: 'Condition on Discharge',
    type: 'select',
    options: [
      'Stable',
      'Improved',
      'Recovered',
      'Critical',
      'Transferred',
      'Against Medical Advice',
      'Expired',
    ],
    required: true,
  },
  {
    section: 'Discharge Information',
    name: 'disposition',
    label: 'Disposition',
    type: 'select',
    options: [
      'Discharged to Home',
      'Transferred to Other Facility',
      'Referred to OPD',
      'Against Medical Advice',
      'Home Against Advice',
      'Expired',
    ],
    required: true,
  },

  // Discharge Diagnostics
  {
    section: 'Discharge Diagnostics',
    name: 'finalDiagnosis',
    label: 'Final Diagnosis',
    type: 'textarea',
    placeholder: 'Final diagnosis upon discharge...',
    required: true,
  },
  {
    section: 'Discharge Diagnostics',
    name: 'diagnosticSummary',
    label: 'Diagnostic Summary',
    type: 'textarea',
    placeholder:
      'Summarize relevant laboratory, imaging, and diagnostic findings during admission...',
  },
  {
    section: 'Discharge Diagnostics',
    name: 'proceduresPerformed',
    label: 'Procedures Performed',
    type: 'textarea',
    placeholder:
      'List procedures, operations, treatments, or special interventions performed...',
  },

  // Discharge Instructions
  {
    section: 'Discharge Instructions',
    name: 'dischargeMedications',
    label: 'Discharge Medications',
    type: 'textarea',
    placeholder:
      'List discharge medications with dose, route, frequency, and duration...',
  },
  {
    section: 'Discharge Instructions',
    name: 'patientInstructions',
    label: 'Patient Instructions',
    type: 'textarea',
    placeholder:
      'Activity restrictions, diet, wound care, warning signs to watch for...',
    required: true,
  },
  {
    section: 'Discharge Instructions',
    name: 'followUpPlan',
    label: 'Follow-up Plan',
    placeholder: 'e.g., OPD follow-up in 1 week with Dr. _____',
    required: true,
  },
];

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function BillingClearancePanel() {
  const [billingRows, setBillingRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBilling = async () => {
    setIsLoading(true);
    setError('');

    try {
      const rows = await loadPatientRows(BILLING_COLLECTION_NAME, {
        sortBy: 'createdAt',
        sortDirection: 'asc',
      });

      setBillingRows(rows);
    } catch (err) {
      console.error(err);
      setError('Failed to load billing items from Firestore.');
      setBillingRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const billingSummary = useMemo(() => {
    let totalCharges = 0;
    let paidAmount = 0;
    let waivedAmount = 0;
    let pendingAmount = 0;

    billingRows.forEach((item) => {
      const amount = Number(item.amount) || 0;

      totalCharges += amount;

      if (item.status === 'Paid') {
        paidAmount += amount;
      } else if (item.status === 'Waived') {
        waivedAmount += amount;
      } else {
        pendingAmount += amount;
      }
    });

    const balance = totalCharges - paidAmount - waivedAmount;

    let clearanceStatus = 'No Billing Items';

    if (totalCharges > 0 && balance <= 0) {
      clearanceStatus = 'Cleared';
    }

    if (totalCharges > 0 && balance > 0) {
      clearanceStatus = 'For Billing Clearance';
    }

    return {
      totalCharges,
      paidAmount,
      waivedAmount,
      pendingAmount,
      balance,
      clearanceStatus,
    };
  }, [billingRows]);

  const isCleared = billingSummary.clearanceStatus === 'Cleared';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Billing Clearance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Billing status is automatically computed from the Firestore Billing Sheet.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBilling}
          disabled={isLoading}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Billing'}
        </button>
      </div>


      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Total Charges
          </p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {formatPeso(billingSummary.totalCharges)}
          </h3>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            Paid / Waived
          </p>

          <h3 className="mt-2 text-2xl font-bold text-emerald-900">
            {formatPeso(
              billingSummary.paidAmount + billingSummary.waivedAmount
            )}
          </h3>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
            Balance
          </p>

          <h3 className="mt-2 text-2xl font-bold text-amber-900">
            {formatPeso(billingSummary.balance)}
          </h3>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            isCleared
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <p
            className={`text-[11px] font-bold uppercase tracking-wide ${
              isCleared ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            Clearance Status
          </p>

          <h3
            className={`mt-2 text-2xl font-bold ${
              isCleared ? 'text-emerald-900' : 'text-red-900'
            }`}
          >
            {billingSummary.clearanceStatus}
          </h3>
        </div>
      </div>

      {billingRows.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          No billing records found yet. Add billing items in the Billing module
          first, then refresh this section.
        </div>
      )}
    </section>
  );
}

export default function DischargePage() {
  return (
    <AppShell
      title="Discharge"
      subtitle="Discharge planning, diagnostics, instructions, and billing clearance"
    >
      <div className="space-y-6 pb-36">
        <div className="form-shell space-y-6">
        <PageIntro
          title="Discharge Summary"
          description="Prepare discharge diagnostics, instructions, follow-up plans, and billing clearance details."
        />

        <RecordForm
          collectionName="dischargeSummaries"
          fields={fields}
          savedRecordsTitle="Saved Discharge Summaries"
          savedRecordsDescription="View previously saved discharge summaries for this patient."
        />
        </div>

        <BillingClearancePanel />
      </div>
    </AppShell>
  );
}